import { useI18n } from "@/i18n/i18n";

export default function PrivacyPolicyContent() {
  const { locale } = useI18n();

  if (locale === "es") {
    return (
      <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
        <h2 className="text-xl font-bold text-foreground">Política de Privacidad Personal de CriptoCard</h2>
        <p>Fecha de vigencia: 20 de febrero de 2025</p>

        <p>
          Nosotros ("CriptoCard", "nosotros", "nos" o "nuestro") respetamos tu privacidad y estamos comprometidos con proteger tu información personal. Esta Política de Privacidad explica cómo CriptoCard recopila, utiliza y protege tu información personal cuando usas nuestro sitio web y los productos y servicios relacionados (en conjunto, los "Servicios de CriptoCard").
        </p>

        <p>
          Al usar los Servicios de CriptoCard, aceptas la recopilación y el uso de tu información de acuerdo con esta Política de Privacidad.
        </p>

        <h3 className="text-base font-semibold text-foreground">Información que recopilamos</h3>
        <p>
          1. Información personal que proporcionas. Recopilamos información personal que nos proporcionas directamente cuando usas nuestro sitio web o los Servicios de CriptoCard. Esto puede incluir:
        </p>
        <ul className="list-disc pl-5">
          <li>Nombre y apellido;</li>
          <li>Dirección de correo electrónico;</li>
          <li>Número de teléfono;</li>
          <li>Dirección de entrega;</li>
          <li>Datos de pago (por ejemplo, información de tarjeta) para procesar transacciones;</li>
          <li>Credenciales de cuenta (usuario y contraseña);</li>
          <li>Cualquier otra información que decidas proporcionar (por ejemplo, feedback, respuestas a encuestas).</li>
        </ul>

        <p>
          2. Información recopilada automáticamente. Cuando visitas nuestro sitio web, podemos recopilar automáticamente información sobre tu dispositivo y el uso del sitio, incluyendo:
        </p>
        <ul className="list-disc pl-5">
          <li>Dirección IP;</li>
          <li>Tipo de dispositivo e información del navegador;</li>
          <li>Información de uso (páginas visitadas, acciones realizadas, fecha y hora);</li>
          <li>Referencias y navegación (sitios visitados antes y después).</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">Cómo usamos tu información</h3>
        <p>Podemos usar la información que recopilamos para:</p>
        <ul className="list-disc pl-5">
          <li>Proveer, operar y mantener los Servicios de CriptoCard;</li>
          <li>Procesar transacciones y administrar tu cuenta;</li>
          <li>Mejorar la seguridad, prevenir fraude y proteger nuestros derechos;</li>
          <li>Responder consultas, solicitudes y soporte;</li>
          <li>Mejorar el producto, analizar rendimiento y realizar investigación;</li>
          <li>Cumplir obligaciones legales y regulatorias.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">Compartir tu información</h3>
        <p>Podemos compartir tu información en los siguientes casos:</p>
        <ul className="list-disc pl-5">
          <li>Con proveedores de servicios que nos ayudan a operar (por ejemplo, procesamiento de pagos, análisis, soporte);</li>
          <li>Para cumplir con la ley, procesos legales o solicitudes de autoridades competentes;</li>
          <li>Para proteger derechos, seguridad y prevenir fraude;</li>
          <li>En una fusión, adquisición o venta de activos, con las garantías correspondientes.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">Tus derechos y opciones</h3>
        <p>
          Puedes tener derechos sobre tu información personal (acceso, rectificación, eliminación y oposición), dependiendo de tu jurisdicción. También puedes actualizar cierta información desde tu cuenta.
        </p>

        <h3 className="text-base font-semibold text-foreground">Seguridad</h3>
        <p>
          Implementamos medidas razonables para proteger tu información. Sin embargo, ningún método de transmisión o almacenamiento electrónico es 100% seguro, por lo que no podemos garantizar seguridad absoluta.
        </p>

        <h3 className="text-base font-semibold text-foreground">Procesamiento de pagos</h3>
        <p>
          Podemos usar proveedores de procesamiento de pagos para gestionar transacciones. Dichos proveedores pueden recopilar y procesar información de pago de acuerdo con sus propias políticas.
        </p>

        <h3 className="text-base font-semibold text-foreground">Procesamiento de información sujeto al consentimiento del usuario</h3>
        <p>
          Cuando el procesamiento requiera tu consentimiento, lo solicitaremos antes de recopilar o usar información para ese fin. Puedes retirar tu consentimiento en cualquier momento, sujeto a limitaciones legales o contractuales.
        </p>

        <h3 className="text-base font-semibold text-foreground">Divulgación legalmente requerida de información</h3>
        <p>
          Podemos divulgar información personal cuando sea requerido por ley, regulación, proceso judicial o solicitud válida de una autoridad.
        </p>

        <h3 className="text-base font-semibold text-foreground">Otro interés legítimo</h3>
        <p>
          Podemos procesar información cuando sea necesario para nuestros intereses legítimos, como operar nuestro negocio, mantener registros, responder quejas, proteger derechos legales, administrar riesgos y proteger los intereses de los usuarios cuando consideremos que tenemos un deber de hacerlo.
        </p>
        <p>
          Seguiremos usando esta información con ese propósito hasta que el interés legítimo ya no exista o dicho uso no sea necesario para lograrlo.
        </p>

        <h3 className="text-base font-semibold text-foreground">Solicitar, corregir o eliminar información personal</h3>
        <p>
          1. Acceso a tu información personal
          <br />
          Puedes revisar cierta información desde tu cuenta. Para solicitar una copia de toda la información que mantenemos, contáctanos usando los datos al final de esta Política.
        </p>
        <p>
          2. Eliminación o cambio de información
          <br />
          Si deseas eliminar o modificar información personal que nos proporcionaste, contáctanos. Esto puede limitar los servicios que podemos ofrecer.
        </p>
        <p>
          3. Verificación de identidad
          <br />
          Para proteger tu información, podemos verificar tu identidad antes de conceder acceso, realizar cambios o eliminar datos.
        </p>
        <p>
          4. Periodo de retención de datos personales
          <br />
          Salvo que se indique lo contrario, conservamos tu información solo durante el tiempo necesario para:
        </p>
        <ul className="list-disc pl-5">
          <li>Proporcionar los servicios solicitados o ejecutar nuestro contrato;</li>
          <li>Mejorar la experiencia de usuario cuando vuelves a nuestro sitio;</li>
          <li>Cumplir con la ley (por ejemplo, requisitos fiscales); y/o</li>
          <li>Respaldar una reclamación o defensa en procedimientos legales, regulatorios o administrativos.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground">Procesamiento y almacenamiento de datos</h3>
        <p>
          La información personal que recopilamos puede almacenarse y procesarse en Estados Unidos o en cualquier otro país donde CriptoCard, sus afiliados o proveedores operen. Si estás en la Unión Europea u otras regiones con leyes diferentes, reconoces que podemos transferir datos a jurisdicciones con marcos de protección distintos a los de tu país.
        </p>
        <p>
          Conservamos la información personal solo el tiempo necesario y aplicamos medios comercialmente razonables para protegerla. Aun así, ningún método es completamente seguro.
        </p>
        <p>
          Cuando solicites la eliminación de tus datos o cuando ya no sean relevantes para nuestras operaciones, los eliminaremos dentro de un plazo razonable.
        </p>

        <h3 className="text-base font-semibold text-foreground">Uso de cookies</h3>
        <p>
          Como muchos sitios web, usamos "cookies". Una cookie es un fragmento pequeño de datos que el navegador almacena en tu dispositivo. Podemos registrar automáticamente información como URL, IP, tipo/idioma del navegador, actividad, páginas vistas, y fecha/hora de visita para analizar tendencias y mejorar el sitio.
        </p>
        <p>
          Nuestro sitio puede usar Google Analytics, que utiliza cookies para ayudarnos a analizar el uso del sitio. Puedes rechazar el uso de cookies desde la configuración de tu navegador; sin embargo, algunas funciones pueden no estar disponibles.
        </p>
        <p>
          Google ofrece un complemento de inhabilitación para evitar el uso de datos por Google Analytics. Puedes obtener más información aquí:{" "}
          <a
            href="https://support.google.com/analytics/answer/181881?hl=es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            https://support.google.com/analytics/answer/181881?hl=es
          </a>
          .
        </p>

        <h3 className="text-base font-semibold text-foreground">Cambios a esta Política de Privacidad</h3>
        <p>
          Podemos actualizar esta Política de Privacidad periódicamente. Publicaremos la versión actualizada en esta página. El uso continuo de nuestros servicios después de los cambios constituye tu aceptación de la nueva Política.
        </p>

        <h3 className="text-base font-semibold text-foreground">Contáctanos</h3>
        <p>
          Tienes derecho a ser informado sobre cómo se recopilan y usan tus datos, a conocer qué datos recopilamos y cómo se procesan, a corregirlos y solicitar su eliminación. También puedes restringir u oponerte a nuestro uso de tus datos según corresponda.
        </p>
        <p>
          Si tienes preguntas o inquietudes sobre esta Política de Privacidad o nuestras prácticas, contáctanos en support@criptocard.io.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pb-8 pt-4 text-left text-sm text-muted">
      <h2 className="text-xl font-bold text-foreground">
        CriptoCard Personal Privacy Policy
      </h2>
      <p>Effective Date: February 20, 2025</p>

      <p>
        We («CriptoCard», «we», «us», or «our») respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how CriptoCard collects, uses, and safeguards your personal information when you use our website and related products and services (collectively, «CriptoCard Services»).
      </p>

      <p>
        By using CriptoCard Services, you agree to the collection and use of your information in accordance with this Privacy Policy.
      </p>

      <h3 className="text-base font-semibold text-foreground">Information We Collect</h3>
      <p>
        1. Personal Information You provide. We collect personal information that you provide directly to us when you use our Website or CriptoCard Services. This may include:
      </p>
      <ul className="list-disc pl-5">
        <li>Name and surname;</li>
        <li>Email address;</li>
        <li>Phone number;</li>
        <li>Delivery address;</li>
        <li>Payment details (e.g., credit card information) for processing transactions;</li>
        <li>Account credentials (username and password);</li>
        <li>Any other information you choose to provide (e.g., feedback, survey responses).</li>
      </ul>

      <p>
        2. Information Collected Automatically. When you visit our Website, we may automatically collect certain information about your device and usage of our Website, including:
      </p>
      <ul className="list-disc pl-5">
        <li>IP address;</li>
        <li>Device type and browser information;</li>
        <li>Pages visited and time spent on each page;</li>
        <li>Referring website or search terms used to find our Website;</li>
        <li>Other technical information related to your device and browsing behavior.</li>
      </ul>

      <p>
        3. Cookies and Tracking Technologies. We use cookies and similar tracking technologies to enhance your experience on our Website, to analyze website usage, and to personalize content and ads. You can control the use of cookies through your browser settings.
      </p>

      <h3 className="text-base font-semibold text-foreground">How We Use Your Information</h3>
      <p>We may use the information we collect for the following purposes:</p>
      <ul className="list-disc pl-5">
        <li>To provide, maintain, and improve CriptoCard Services;</li>
        <li>To process and fulfill your orders, including payment processing and delivery;</li>
        <li>To communicate with you, including responding to your inquiries and sending you updates, promotional materials, and service-related notifications;</li>
        <li>To personalize your experience on our Website and provide content tailored to your interests;</li>
        <li>To analyze usage and trends to improve our Website and marketing efforts;</li>
        <li>To detect, prevent, and address technical issues or security threats;</li>
        <li>To comply with legal obligations and protect our legal rights.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">Sharing Your Information</h3>
      <p>
        We do not sell or rent your personal information to third parties. However, we may share your information with trusted third parties who assist us in operating our Website, conducting our business, or providing services to you, such as payment processors, shipping partners, and marketing service providers. We ensure that these third parties agree to protect your information in compliance with this Privacy Policy.
      </p>

      <h3 className="text-base font-semibold text-foreground">Your Rights and Choices</h3>
      <p>You have the right to:</p>
      <ul className="list-disc pl-5">
        <li>Access and review the personal information we hold about you;</li>
        <li>Request correction or deletion of your personal information;</li>
        <li>Opt-out of receiving marketing communications from us;</li>
        <li>Control cookies and tracking preferences through your browser settings.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">Security</h3>
      <p>
        We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, or destruction. However, no method of transmission over the Internet is completely secure, and we cannot guarantee absolute security.
      </p>

      <p>
        This Privacy Policy only covers our own collecting and handling of data. We only work with partners, affiliates and third-party providers whose privacy policies align with ours, however, we cannot accept responsibility or liability for their respective privacy practices.
      </p>

      <p>
        Our Website may link to external sites that are not operated by us. Please be aware that we have no control over the content and policies of those sites, and cannot accept responsibility or liability for their respective privacy practices.
      </p>

      <h3 className="text-base font-semibold text-foreground">Payment Processing</h3>
      <p>
        Payment processing services may personal information of our users solely for the purpose of performing specific tasks on our behalf. We do not share any personally identifying information with them without explicit consent of our users. We do not give payment processors permission to disclose or use any of our data for any other purpose.
      </p>
      <p>
        We will refuse government and law enforcement requests for personal information if we believe a request is too broad or unrelated to its stated purpose. However, we may decide to cooperate if we believe the requested information is necessary and appropriate to comply with legal process, to protect our own rights and property, to protect the safety of the public and any person, to prevent a crime, or to prevent what we reasonably believe to be illegal, legally actionable, or unethical activity.
      </p>
      <p>
        We do not otherwise share or supply personal information to third parties. We do not sell or rent personal information of our users to marketers or third parties.
      </p>

      <h3 className="text-base font-semibold text-foreground">Processing of Information Subject to User Consent</h3>
      <p>
        Through certain actions when otherwise there is no contractual relationship between user and us, such as when, after having browsed our Website, user requests us to provide more information about our business, including about our services, we may request the user to provide consent to us in order to process information that may be personal information.
      </p>
      <p>
        Wherever practicable, we aim to obtain explicit user consent to process personal information. Sometimes user might give consent implicitly, such as when user sends us a message containing personal information by email to which user expects us to reply.
      </p>
      <p>
        When we communicate with users about our business, we will use the contact information provided to us to discuss technical issues, services, and other information of interest to users. We may also send users email messages containing useful information and promotional information about our business. Except where a particular user has consented to our use of user information for a specific purpose, we will not use any of user&apos;s information in any way that would identify the user personally.
      </p>
      <p>
        We will continue to process user information on this basis until user withdraws consent or it can be reasonably assumed that user consent is no longer valid.
      </p>
      <p>
        Each user may withdraw consent at any time by instructing us using the contact information at the end of this Policy, or changing user elections within our Website. However, if user does so, he or she may no longer be able to use our Website or CriptoCard Services.
      </p>

      <h3 className="text-base font-semibold text-foreground">Legally Required Disclosure of Information</h3>
      <p>
        We may be legally required to disclose user personal information, if such disclosure is:
      </p>
      <ul className="list-disc pl-5">
        <li>required by subpoena, law, or other legal process;</li>
        <li>necessary to assist law enforcement officials or governmental authorities;</li>
        <li>necessary to investigate violations of or otherwise enforce our Terms and Conditions of Use;</li>
        <li>necessary to protect us from legal action or claims from third parties including users; and/or</li>
        <li>necessary to protect the legal rights, personal/real property, or personal safety of our company, customers, third party partners, employees, and affiliates.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">Other Legitimate Interest</h3>
      <p>
        We may process information or use it to communicate with users on the basis that doing so is necessary to achieve a legitimate interest, either to a particular user or to us. Where we use user information on this basis, we do so after having given careful consideration to:
      </p>
      <ul className="list-disc pl-5">
        <li>whether the same objective could be achieved through other means;</li>
        <li>whether processing (or not processing) might cause a particular user any harm;</li>
        <li>whether the user would expect us to process his or her data, and whether the user would consider it reasonable to do so.</li>
      </ul>
      <p>For example, we may process user data or communicate with the user for any of the following purposes:</p>
      <ul className="list-disc pl-5">
        <li>operating our business, which includes analyzing our performance, meeting our legal obligations, developing our workforce, and conducting research;</li>
        <li>record-keeping for the proper and necessary administration of our business;</li>
        <li>responding to user complaints or service requests;</li>
        <li>protecting and asserting the legal rights of any party;</li>
        <li>insuring against or obtaining professional advice that is required to manage business risk; and/or protecting the interests of any particular user where we believe we have a duty to do so.</li>
      </ul>
      <p>
        We will continue to use this information for this purpose until the legitimate interest no longer exists or such use is not necessary to achieve the legitimate interest.
      </p>

      <h3 className="text-base font-semibold text-foreground">Requesting, Amending or Deleting Personal Information</h3>
      <p>
        1. Access to User Personal Information
        <br />
        Any user may review certain information that we hold about him or her by signing in to user account on our Website. To obtain a copy of all information we maintain about a particular user, that user may send us a request using the contact information at the end of this Policy. After receiving user request, we will tell when we expect to provide the user with the requested information.
      </p>
      <p>
        2. Removal or Change of User Information
        <br />
        If a user wishes us to remove or change personal information that he or she has provided us, the user may contact us at the contact information at the end of this Policy. However, the removal or change of user information may limit the service we can provide.
      </p>
      <p>
        3. Verification of Information
        <br />
        When we receive any request to access, edit or delete personal information, we will first take reasonable steps to verify user identity before granting access or otherwise taking any action. This is important to safeguard user information.
      </p>
      <p>
        4. Retention Period for Personal Data
        <br />
        Except as otherwise mentioned in this Policy, we keep user personal information only for as long as required by us:
      </p>
      <ul className="list-disc pl-5">
        <li>to provide a particular user with the services he or she has requested, or otherwise to perform or enforce our contract;</li>
        <li>to continue to provide the best possible user experience to visitors who return to our Website to collect information;</li>
        <li>to comply with other law, including for any period demanded by tax authorities; and/or to support a claim or defense in any court or in any legal, regulatory or administrative proceeding.</li>
      </ul>

      <h3 className="text-base font-semibold text-foreground">Data Processing and Data Storage</h3>
      <p>
        The personal information we collect is stored and processed in the United States of America or any other country in which CriptoCard, its subsidiaries, affiliates, or service providers operate. We only transfer user data within jurisdictions subject to data protection laws that reflect our commitment to protecting the privacy of our users. If you are located in the European Union or other regions with laws governing data collection and use that may differ from U.S. law, please note that we may transfer Personal Data, to a country and jurisdiction that does not have the same data protection laws as your jurisdiction, and you acknowledge such transfer of information to the U.S. or any other country in which CriptoCard or its affiliates, or service providers maintain facilities and the use and disclosure of information about you as described in this Privacy Policy.
      </p>
      <p>
        We only retain personal information for as long as necessary to provide our services. While we retain personal information, we will protect it by applying commercially acceptable means to prevent loss or theft, as well as unauthorized access, disclosure, copying, use, or modification. That having been said, we would like to remind users that no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security of personal information.
      </p>
      <p>
        Whenever users request us to delete their personal information, or where user personal information is no longer relevant to our operations, we will erase it from our system within a reasonable timeframe.
      </p>

      <h3 className="text-base font-semibold text-foreground">Use of Cookies</h3>
      <p>
        Like many other websites, we use «Cookies». A Cookie is a small piece of data stored on user computer or mobile device by user&apos;s web browser. We may automatically record information when users visit our Website, including the URL, IP address, browser type and language, visitor activity on our Website, details of the websites visited before or after users visit our Website, pages viewed and activities undertaken whilst using our services, the date and time of user visit. We use this information to analyze trends among our users to help improve our Website or customize communications and information that users receive from us. We also use cookies to enhance user online experience by eliminating the need to log in multiple times for specific content. We use «cookies» to collect information about our users and user activity on our Website.
      </p>
      <p>
        Our Website uses Google Analytics, a web analytics service provided by Google, Inc. Google Analytics uses «cookies», which are text files placed on user computer, to help us analyze how our users use our Website. The information generated by the cookie about user activity on our Website is transmitted to and stored by Google on servers in the United States. Google will use this information for the purpose of evaluating use of our Website, compiling reports on user activity for website operators and providing other services relating to internet usage. Google may also transfer this information to third parties where required to do so by law, or where such third parties process the information on Google&apos;s behalf. Google does not associate IP address with any other data held by Google. Each user of our Website may refuse the use of cookies by selecting the appropriate settings on his or her browser, however users who do this may not be able to use the full functionality of our Website. By using our Website, users consent to the processing of data about them by Google in the manner and for the purposes set out above.
      </p>
      <p>
        To provide visitors of our Website with the ability to prevent their data from being used by Google Analytics, Google has developed the Google Analytics opt-out browser add-on. Users who wish to opt-out should download and install the add-on for their web browser. The Google Analytics opt-out add-on is designed to be compatible with Chrome, Safari, Firefox and Microsoft Edge. In order to function, the opt-out add-on must be able to load and execute properly on the user&apos;s browser. Users may want to learn more about the opt-out and how to properly install the browser add-on by accessing this link: <a href="https://support.google.com/analytics/answer/181881?hl=en" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">https://support.google.com/analytics/answer/181881?hl=en</a>.
      </p>

      <h3 className="text-base font-semibold text-foreground">Changes to This Privacy Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page. Your continued use of our Website and Services after any changes constitute your acceptance of the new Privacy Policy.
      </p>

      <h3 className="text-base font-semibold text-foreground">Contact Us</h3>
      <p>
        As our user, you have the right to be informed about how your data is collected and used. You are entitled to know what data we collect about you, and how it is processed. You are entitled to correct and update any personal information about you, and to request that such information be deleted. You may amend or remove your account information at any time, using the tools provided in your account control panel.
      </p>
      <p>
        You are entitled to restrict or object to our use of your data, while retaining the right to use your personal information for your own purposes.
      </p>
      <p>
        If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@criptocard.io.
      </p>
    </div>
  );
}
