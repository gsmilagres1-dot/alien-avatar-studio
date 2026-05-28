import { createFileRoute } from "@tanstack/react-router";

type Body = {
  imageDataUrl: string; // data:image/...;base64,...
  planet: string;
  species: string;
};

export const Route = createFileRoute("/api/generate-alien")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { imageDataUrl, planet, species } = (await request.json()) as Body;
        if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
          return new Response("Invalid image", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const prompt = `Transforme a pessoa na foto em um avatar alienígena cinematográfico da espécie ${species} do planeta ${planet}.
Mantenha a estrutura facial reconhecível, o mesmo enquadramento de retrato e a iluminação geral, mas reinvente a aparência com características alienígenas inspiradas em filmes de ficção científica clássicos (Star Trek, Star Wars, Mass Effect, Avatar, Distrito 9, District 9, Guardians of the Galaxy).
Inclua: pele de cor incomum (verde, azul, roxa, prateada ou iridescente), texturas alienígenas sutis (escamas finas, padrões luminescentes, sardas bioluminescentes), olhos grandes e expressivos com íris fora do humano, possíveis adornos sutis (antenas curtas, cristas frontais, marcas tribais).
Estilo: retrato fotográfico realista, qualidade de pôster de cinema, fundo cósmico nebuloso roxo/verde neon com poeira estelar. Foco no rosto e ombros. Sem texto, sem watermark.`;

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageDataUrl } },
                  ],
                },
              ],
              modalities: ["image", "text"],
            }),
            signal: request.signal,
          },
        );

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(text, { status: upstream.status });
        }
        const json = (await upstream.json()) as {
          data?: { b64_json?: string }[];
        };
        const b64 = json.data?.[0]?.b64_json;
        if (!b64) {
          return new Response("No image returned", { status: 502 });
        }
        return Response.json({ imageDataUrl: `data:image/png;base64,${b64}` });
      },
    },
  },
});
