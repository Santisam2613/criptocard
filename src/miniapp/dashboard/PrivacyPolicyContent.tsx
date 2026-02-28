import { useI18n } from "@/i18n/i18n";

export default function PrivacyPolicyContent() {
  const { locale } = useI18n();

  if (locale === "es") {
    return (
      <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
        <h2 className="text-xl font-bold text-foreground">Política de Privacidad de CriptoCard</h2>
        <p>Fecha de vigencia: 28 de febrero de 2026</p>

        <p>
          En CriptoCard Finance Inc ("CriptoCard", "nosotros"), respetamos tu privacidad. Esta política explica cómo recopilamos, usamos y protegemos tus datos cuando usas nuestra Mini App en Telegram y nuestros servicios financieros.
        </p>

        <h3 className="text-base font-semibold text-foreground">1. Información que recopilamos</h3>
        <p>Podemos recopilar la siguiente información:</p>
        <ul className="list-disc pl-5">
          <li><strong>Datos de Identidad (KYC):</strong> Nombre completo, fecha de nacimiento, documento de identidad, selfie y prueba de residencia. Estos datos son procesados directamente por nuestro socio <strong>Sumsub</strong>.</li>
          <li><strong>Datos de Contacto:</strong> ID de Telegram, número de teléfono y correo electrónico.</li>
          <li><strong>Datos Financieros:</strong> Historial de transacciones, direcciones de billetera de criptomonedas y datos de la tarjeta virtual.</li>
          <li><strong>Datos Técnicos:</strong> Dirección IP, tipo de dispositivo y datos de uso de la aplicación.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">2. Uso de proveedores externos</h3>
        <p>
          Para prestar nuestros servicios, compartimos datos estrictamente necesarios con proveedores de confianza:
        </p>
        <ul className="list-disc pl-5">
          <li><strong>Sumsub:</strong> Para verificación de identidad y cumplimiento de normativas AML (Anti-Lavado de Dinero).</li>
          <li><strong>Coinbase Commerce:</strong> Para procesar tus recargas de saldo con criptomonedas.</li>
          <li><strong>Stripe:</strong> Para la emisión de tarjetas virtuales y procesamiento de pagos con tarjeta. Stripe puede recopilar sus propios datos según su política de privacidad.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">3. Cómo usamos tus datos</h3>
        <p>Utilizamos tu información para:</p>
        <ul className="list-disc pl-5">
          <li>Verificar tu identidad y cumplir con obligaciones legales.</li>
          <li>Procesar tus transacciones de recarga y gastos.</li>
          <li>Proporcionar soporte al cliente y resolver disputas.</li>
          <li>Detectar y prevenir fraudes o actividades ilícitas.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">4. Seguridad de los datos</h3>
        <p>
          Implementamos medidas de seguridad robustas para proteger tus datos. Sin embargo, recuerda que ninguna transmisión por internet es 100% segura. Tus datos sensibles de identidad son almacenados de forma segura por Sumsub y tus datos de tarjeta por Stripe, cumpliendo con estándares PCI-DSS.
        </p>

        <h3 className="text-base font-semibold text-foreground">5. Tus derechos</h3>
        <p>
          Tienes derecho a acceder, corregir o eliminar tus datos personales, sujeto a nuestras obligaciones legales de retención de datos financieros (generalmente 5 años). Para ejercer estos derechos, contáctanos.
        </p>

        <h3 className="text-base font-semibold text-foreground">6. Cambios</h3>
        <p>
          Podemos actualizar esta política. Te notificaremos de cambios significativos a través de la aplicación.
        </p>

        <h3 className="text-base font-semibold text-foreground">Contacto</h3>
        <p>
          Dudas de privacidad: <a href="mailto:support@criptocard.io" className="text-brand hover:underline">support@criptocard.io</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
      <h2 className="text-xl font-bold text-foreground">CriptoCard Privacy Policy</h2>
      <p>Effective Date: February 28, 2026</p>

      <p>
        At CriptoCard Finance Inc ("CriptoCard", "we"), we respect your privacy. This policy explains how we collect, use, and protect your data when you use our Telegram Mini App and financial services.
      </p>

      <h3 className="text-base font-semibold text-foreground">1. Information We Collect</h3>
      <p>We may collect the following information:</p>
      <ul className="list-disc pl-5">
        <li><strong>Identity Data (KYC):</strong> Full name, date of birth, ID document, selfie, and proof of residence. These data are processed directly by our partner <strong>Sumsub</strong>.</li>
        <li><strong>Contact Data:</strong> Telegram ID, phone number, and email address.</li>
        <li><strong>Financial Data:</strong> Transaction history, cryptocurrency wallet addresses, and virtual card data.</li>
        <li><strong>Technical Data:</strong> IP address, device type, and app usage data.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">2. Use of Third-Party Providers</h3>
      <p>
        To provide our services, we share strictly necessary data with trusted providers:
      </p>
      <ul className="list-disc pl-5">
        <li><strong>Sumsub:</strong> For identity verification and AML (Anti-Money Laundering) compliance.</li>
        <li><strong>Coinbase Commerce:</strong> To process your cryptocurrency balance top-ups.</li>
        <li><strong>Stripe:</strong> For virtual card issuance and card payment processing. Stripe may collect its own data according to its privacy policy.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">3. How We Use Your Data</h3>
      <p>We use your information to:</p>
      <ul className="list-disc pl-5">
        <li>Verify your identity and comply with legal obligations.</li>
        <li>Process your top-up and spending transactions.</li>
        <li>Provide customer support and resolve disputes.</li>
        <li>Detect and prevent fraud or illicit activities.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">4. Data Security</h3>
      <p>
        We implement robust security measures to protect your data. However, please remember that no internet transmission is 100% secure. Your sensitive identity data is securely stored by Sumsub, and your card data by Stripe, complying with PCI-DSS standards.
      </p>

      <h3 className="text-base font-semibold text-foreground">5. Your Rights</h3>
      <p>
        You have the right to access, correct, or delete your personal data, subject to our legal obligations for financial data retention (generally 5 years). To exercise these rights, contact us.
      </p>

      <h3 className="text-base font-semibold text-foreground">6. Changes</h3>
      <p>
        We may update this policy. We will notify you of significant changes through the application.
      </p>

      <h3 className="text-base font-semibold text-foreground">Contact</h3>
      <p>
        Privacy concerns: <a href="mailto:support@criptocard.io" className="text-brand hover:underline">support@criptocard.io</a>.
      </p>
    </div>
  );
}
