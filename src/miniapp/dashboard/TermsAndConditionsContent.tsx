import { useI18n } from "@/i18n/i18n";

export default function TermsAndConditionsContent() {
  const { locale } = useI18n();

  if (locale === "es") {
    return (
      <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
        <h2 className="text-xl font-bold text-foreground">Términos de Servicio de CriptoCard</h2>
        <p>Vigente a partir del 28 de febrero de 2026.</p>

        <p>
          Estos Términos de Servicio (los "Términos") constituyen un acuerdo vinculante entre tú ("tú" o "tu") y CriptoCard Finance Inc ("CriptoCard", "nosotros", "nos" o "nuestro"), que regula el uso de la plataforma CriptoCard, la billetera digital, los servicios de recarga y las tarjetas virtuales CriptoCard Spend (los "Servicios").
        </p>

        <h3 className="text-base font-semibold text-foreground">1. Descripción del Servicio</h3>
        <p>
          CriptoCard ofrece una plataforma que permite a los usuarios gestionar una billetera digital en USDT, recargar saldo mediante criptomonedas y acceder a una tarjeta virtual Visa prepagada para realizar gastos en comercios internacionales.
        </p>

        <h3 className="text-base font-semibold text-foreground">2. Elegibilidad y Registro</h3>
        <p>
          Para utilizar los Servicios, debes tener al menos 18 años y residir en una jurisdicción donde operamos. Debes registrarte a través de nuestra Mini App en Telegram y proporcionar información veraz, precisa y completa.
        </p>

        <h3 className="text-base font-semibold text-foreground">3. Verificación de Identidad (KYC)</h3>
        <p>
          Para acceder a ciertas funciones, como la emisión de la tarjeta virtual, debes completar un proceso de verificación de identidad (Know Your Customer o KYC). Utilizamos <strong>Sumsub</strong>, un proveedor externo líder, para recopilar y verificar tu documento de identidad y prueba de vida. Al utilizar nuestros servicios, aceptas someterte a este proceso y autorizas a Sumsub a procesar tus datos.
        </p>

        <h3 className="text-base font-semibold text-foreground">4. Recargas y Pagos</h3>
        <p>
          Las recargas de saldo en tu billetera CriptoCard se procesan a través de <strong>Coinbase Commerce</strong>.
        </p>
        <ul className="list-disc pl-5">
          <li>Aceptamos depósitos en diversas criptomonedas soportadas por Coinbase Commerce.</li>
          <li>El saldo se acredita en tu cuenta como USDT (Tether) una vez que la transacción es confirmada en la blockchain.</li>
          <li>CriptoCard no se hace responsable por retrasos en la red blockchain o errores al enviar fondos a direcciones incorrectas.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">5. Tarjeta Virtual CriptoCard Spend</h3>
        <p>
          La Tarjeta es emitida por nuestro socio bancario (vía Stripe Issuing) bajo licencia de Visa.
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Moneda:</strong> La tarjeta está denominada en Dólares Estadounidenses (USD). Al usar tu saldo de USDT para gastos con la tarjeta, se realiza una conversión automática.</li>
          <li><strong>Límites:</strong> CriptoCard puede imponer límites de gasto diarios o mensuales, los cuales serán visibles en tu panel de control.</li>
          <li><strong>Uso Prohibido:</strong> No puedes usar la tarjeta para actividades ilegales, juegos de azar, contenido para adultos o cualquier otra categoría prohibida por Visa o nuestros socios bancarios.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">6. Tarifas y Comisiones</h3>
        <p>
          El uso de los Servicios está sujeto a las siguientes tarifas (sujetas a cambios con previo aviso):
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Emisión de Tarjeta:</strong> Gratis (o según promoción vigente).</li>
          <li><strong>Mantenimiento Mensual:</strong> $0.</li>
          <li><strong>Comisión por Recarga:</strong> 1% (estimado, puede variar según la red).</li>
          <li><strong>Transacciones Internacionales (no USD):</strong> Hasta 3% por conversión de divisa.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">7. Privacidad</h3>
        <p>
          Tu privacidad es importante. Consulta nuestra Política de Privacidad para entender cómo recopilamos, usamos y compartimos tus datos, incluyendo el intercambio con proveedores como Sumsub (KYC), Coinbase (Pagos) y Stripe (Emisión).
        </p>

        <h3 className="text-base font-semibold text-foreground">8. Terminación</h3>
        <p>
          Podemos suspender o cerrar tu cuenta en cualquier momento si violas estos Términos, si sospechamos actividad fraudulenta o si lo requieren las autoridades legales.
        </p>

        <h3 className="text-base font-semibold text-foreground">9. Contacto</h3>
        <p>
          Si tienes preguntas sobre estos términos, contáctanos en <a href="mailto:support@criptocard.io" className="text-brand hover:underline">support@criptocard.io</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
      <h2 className="text-xl font-bold text-foreground">CriptoCard Service Terms</h2>
      <p>Effective Date: February 28, 2026.</p>

      <p>
        These Service Terms (the "Terms") constitute a binding agreement between you ("you" or "your") and CriptoCard Finance Inc ("CriptoCard", "we", "us", or "our"), governing your use of the CriptoCard platform, digital wallet, top-up services, and CriptoCard Spend virtual cards (the "Services").
      </p>

      <h3 className="text-base font-semibold text-foreground">1. Service Description</h3>
      <p>
        CriptoCard offers a platform that allows users to manage a digital wallet in USDT, top up balance using cryptocurrencies, and access a prepaid Visa virtual card for spending at international merchants.
      </p>

      <h3 className="text-base font-semibold text-foreground">2. Eligibility and Registration</h3>
      <p>
        To use the Services, you must be at least 18 years old and reside in a jurisdiction where we operate. You must register through our Telegram Mini App and provide true, accurate, and complete information.
      </p>

      <h3 className="text-base font-semibold text-foreground">3. Identity Verification (KYC)</h3>
      <p>
        To access certain features, such as virtual card issuance, you must complete an identity verification process (Know Your Customer or KYC). We use <strong>Sumsub</strong>, a leading third-party provider, to collect and verify your identity document and proof of life. By using our services, you agree to undergo this process and authorize Sumsub to process your data.
      </p>

      <h3 className="text-base font-semibold text-foreground">4. Top-ups and Payments</h3>
      <p>
        Balance top-ups to your CriptoCard wallet are processed through <strong>Coinbase Commerce</strong>.
      </p>
      <ul className="list-disc pl-5">
        <li>We accept deposits in various cryptocurrencies supported by Coinbase Commerce.</li>
        <li>Balance is credited to your account as USDT (Tether) once the transaction is confirmed on the blockchain.</li>
        <li>CriptoCard is not responsible for blockchain network delays or errors in sending funds to incorrect addresses.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">5. CriptoCard Spend Virtual Card</h3>
      <p>
        The Card is issued by our banking partner (via Stripe Issuing) under license from Visa.
      </p>
      <ul className="list-disc pl-5">
        <li><strong>Currency:</strong> The card is denominated in United States Dollars (USD). When using your USDT balance for card expenses, an automatic conversion is performed.</li>
        <li><strong>Limits:</strong> CriptoCard may impose daily or monthly spending limits, which will be visible in your dashboard.</li>
        <li><strong>Prohibited Use:</strong> You may not use the card for illegal activities, gambling, adult content, or any other category prohibited by Visa or our banking partners.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">6. Fees and Charges</h3>
      <p>
        Use of the Services is subject to the following fees (subject to change with prior notice):
      </p>
      <ul className="list-disc pl-5">
        <li><strong>Card Issuance:</strong> Free (or per current promotion).</li>
        <li><strong>Monthly Maintenance:</strong> $0.</li>
        <li><strong>Top-up Fee:</strong> 1% (estimated, may vary by network).</li>
        <li><strong>International Transactions (non-USD):</strong> Up to 3% for currency conversion.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">7. Privacy</h3>
      <p>
        Your privacy is important. Please refer to our Privacy Policy to understand how we collect, use, and share your data, including sharing with providers like Sumsub (KYC), Coinbase (Payments), and Stripe (Issuance).
      </p>

      <h3 className="text-base font-semibold text-foreground">8. Termination</h3>
      <p>
        We may suspend or terminate your account at any time if you violate these Terms, if we suspect fraudulent activity, or if required by legal authorities.
      </p>

      <h3 className="text-base font-semibold text-foreground">9. Contact</h3>
      <p>
        If you have questions about these terms, contact us at <a href="mailto:support@criptocard.io" className="text-brand hover:underline">support@criptocard.io</a>.
      </p>
    </div>
  );
}
