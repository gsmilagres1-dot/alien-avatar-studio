const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2 text-center text-xs text-red-800">
        Pagamento de produção não configurado. Finalize a ativação para aceitar pagamentos reais.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800">
        Pagamentos em modo de teste. Use cartão <code>4242 4242 4242 4242</code> para testar.
      </div>
    );
  }
  return null;
}
