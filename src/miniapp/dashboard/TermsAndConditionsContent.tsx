import { useI18n } from "@/i18n/i18n";

export default function TermsAndConditionsContent() {
  const { locale } = useI18n();

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
