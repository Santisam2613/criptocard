import { useI18n } from "@/i18n/i18n";

export default function TermsAndConditionsContent() {
  const { locale } = useI18n();

  if (locale === "es") {
    return (
      <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
        <h2 className="text-xl font-bold text-foreground">Términos de la tarjeta CriptoCard Spend</h2>
        <p>
          Estos Términos de la tarjeta CriptoCard Spend (los "Términos de la Tarjeta") constituyen un acuerdo vinculante entre tú ("tú" o "tu") y CriptoCard Finance Inc, incluyendo afiliadas, sucesores y cesionarios ("CriptoCard", "nosotros", "nos" o "nuestro"), que regula el uso de las tarjetas CriptoCard Spend, incluyendo el proceso de obtención y administración de dichas tarjetas, cuyo acceso te brinda CriptoCard Finance Inc ("CriptoCard Personal").
        </p>

        <h3 className="text-base font-semibold text-foreground">Divulgaciones importantes</h3>
        <p>
          Las tasas, comisiones y otra información importante sobre tu tarjeta CriptoCard Spend (la "Tarjeta") se describen en estas divulgaciones.
        </p>
        <p>Vigente a partir del 20 de febrero de 2025.</p>

        <p>Tasas de interés y cargos por interés: 0%.</p>
        <p>Tasa porcentual anual (APR) para compras: 0%.</p>

        <p>
          Actualmente tu tarjeta CriptoCard Personal tiene 0% de interés en todas las compras. CriptoCard se reserva el derecho de implementar intereses en el futuro para nuevas compras. CriptoCard informará cualquier cambio a este acuerdo antes de introducir intereses u otros cargos asociados con tu Tarjeta.
        </p>

        <h3 className="text-base font-semibold text-foreground">Comisión por transacción (Comisiones)</h3>
        <p className="font-semibold">1. Compra en el exterior</p>
        <ul className="list-disc pl-5">
          <li>Comisión por cambio de divisa (no USD): hasta 3%</li>
          <li>Comisión transfronteriza: hasta 3%</li>
        </ul>
        <p className="font-semibold">2. Comisiones por penalidad</p>
        <ul className="list-disc pl-5">
          <li>Pago tardío: hasta $40</li>
          <li>Pago devuelto: hasta $29</li>
          <li>Penalidad por liquidación: hasta $35</li>
        </ul>

        <p className="font-bold uppercase">
          AL SOLICITAR UNA CUENTA DE TARJETA, ACTIVAR UNA TARJETA O PARTICIPAR EN EL PROGRAMA DE CUALQUIER FORMA, DECLARAS QUE HAS LEÍDO, ENTIENDES Y ACEPTAS ESTOS TÉRMINOS DE EMISIÓN.
        </p>

        <h3 className="text-base font-semibold text-foreground">Términos</h3>
        <p>Antecedentes:</p>
        <p>
          La Tarjeta CriptoCard se te proporciona en nombre de CriptoCard en relación con tu condición de cliente y conforme a tu Acuerdo de Usuario separado entre tú y CriptoCard (los "Términos de Usuario").
        </p>
        <p>
          CriptoCard ha abierto una cuenta para facilitar las transacciones que realizas usando una Tarjeta con base en un límite establecido por CriptoCard según los Términos de Usuario. Entiendes que tienes acceso a los Servicios y a la Tarjeta únicamente en la medida en que CriptoCard lo autorice. Aceptas que CriptoCard satisfará las obligaciones creadas por tu uso de la Tarjeta y que reembolsarás a CriptoCard según tu Acuerdo de Usuario, sujeto a los términos aquí descritos.
        </p>
        <p>
          Los detalles sobre la recopilación, uso y tratamiento de tus datos personales se describen en la Política de Privacidad. Léela cuidadosamente y contáctanos si tienes preguntas. Al abrir, usar o mantener una Tarjeta, consientes y autorizas a CriptoCard a compartir información relacionada con transacciones, incluyendo información de recibos u otros datos personales, para prestar los Servicios.
        </p>

        <h3 className="text-base font-semibold text-foreground">CriptoCard</h3>
        <p>
          El programa de tarjetas es emitido por CriptoCard bajo licencia de Visa. La información sobre el costo de la Tarjeta indicada arriba es correcta a la fecha 20 de febrero de 2025 y puede cambiar posteriormente. Para conocer cambios, contacta al servicio en support@criptocard.io.
        </p>
        <p>
          CriptoCard se reserva el derecho de modificar estos Términos de la Tarjeta o imponer obligaciones o restricciones adicionales en cualquier momento, con o sin aviso. Al continuar usando los Servicios, aceptas quedar sujeto a dichas modificaciones. La fecha al inicio indica la última actualización. Los términos en mayúscula no definidos aquí tendrán el significado indicado en el acuerdo de la plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
      <h2 className="text-xl font-bold text-foreground">
        CriptoCard Spend Card Terms
      </h2>
      <p>
        These CriptoCard Spend Card Terms (the "Card Terms") are a binding agreement between you ("you", or "your"), CriptoCard Finance Inc, including its affiliates, successors, and assigns ("CriptoCard", "we", "us", or "our") that govern your use of the CriptoCard Spend Cards, including the process for obtaining and managing CriptoCard Spend Cards, access to which is provided to you by CriptoCard Finance Inc ("CriptoCard Personal").
      </p>

      <h3 className="text-base font-semibold text-foreground">Important Disclosures</h3>
      <p>
        Rates, fees, and other important information about your CriptoCard Spend Card ("Card") are set forth in these Important Disclosures.
      </p>
      <p>Effective as of February 20, 2025.</p>

      <p>Interest Rates and Interest Charges 0%.</p>
      <p>Annual Percentage Rate (APR) for Purchases 0%.</p>

      <p>
        Your CriptoCard Personal Spend Card is currently Zero [0%] interest on all purchases. CriptoCard reserves the right to implement interest in the future, for new purchases. CriptoCard will disclose any changes to this agreement prior to the introduction of interest and other charges associated with your CriptoCard Card.
      </p>

      <h3 className="text-base font-semibold text-foreground">Transaction Fee (Fees)</h3>
      <p className="font-semibold">1. Foreign Purchase</p>
      <ul className="list-disc pl-5">
        <li>Foreign Exchange Fee (non USD): up to 3%</li>
        <li>Cross Border Fee: up to 3%</li>
      </ul>
      <p className="font-semibold">2. Penalty Fees</p>
      <ul className="list-disc pl-5">
        <li>Late payment: Up to $40</li>
        <li>Returned payment: Up to $29</li>
        <li>Liquidation penalty: Up to $35</li>
      </ul>

      <p className="font-bold uppercase">
        WHEN YOU APPLY FOR A CARD ACCOUNT, ACTIVATE A CARD, OR OTHERWISE PARTICIPATE IN THE PROGRAM IN ANY WAY, YOU REPRESENT THAT YOU HAVE READ, UNDERSTAND, AND AGREE TO THESE ISSUING TERMS.
      </p>

      <h3 className="text-base font-semibold text-foreground">Terms</h3>
      <p>Background:</p>
      <p>
        The CriptoCard Card is provided to you on behalf of CriptoCard in connection with your status as CriptoCard customer and pursuant to your separate User Agreement between you and CriptoCard (the "User Terms").
      </p>
      <p>
        CriptoCard has opened a CriptoCard Account for purposes of facilitating transactions you make using a Card based on a limit established by CriptoCard pursuant to the User Terms. You understand that you have access to the Services and CriptoCard Card only to the extent authorized by the CriptoCard. You acknowledge and agree that CriptoCard will satisfy obligations created through your use of the CriptoCard Card and you will repay CriptoCard based on the terms of your User Agreement, subject to the terms below.
      </p>
      <p>
        Details on CriptoCard’s collection, use, and handling of your personal data are described in Privacy Policy. Please review it carefully and contact CriptoCard if you have any questions. By opening, using, or maintaining a Card, you consent to and direct CriptoCard to share information relating to transactions, including receipt information or other personal data, in order to deliver the Services.
      </p>

      <h3 className="text-base font-semibold text-foreground">CriptoCard</h3>
      <p>
        The card program is issued by the CriptoCard under license from Visa. The information about the cost of the Card described in the above table is accurate as of February 20, 2025. This information may change after that date. To find out what may have changed, call or write the servicer at support@criptocard.io.
      </p>
      <p>
        CriptoCard reserves the right to amend these Card Terms or impose additional obligations or restrictions on you at any time with or without notice to you. By continuing to use the Services, you agree to be bound by such amendments or additional obligations or restrictions. The date on the top of this page shows when the Card Terms were last updated. Capitalized terms that are not defined here have the definitions provided in the Platform Agreement.
      </p>
    </div>
  );
}
