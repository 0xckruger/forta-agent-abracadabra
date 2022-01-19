import BigNumber from "bignumber.js";
import {
    ethers,
    Finding,
    FindingSeverity,
    FindingType,
    getEthersProvider,
    HandleTransaction,
    TransactionEvent
} from "forta-agent";
import {YVWETHV2CAULDRON_ADDRESS, LOGADDCOLLATERAL_EVENT, ETH_DECIMALS} from "./constants";

// Define how large the collateral added should be to trigger an event
const LARGE_COLLATERAL_AMT = 1;
// We will need this later to check BentoBox balance
const ethersProvider = getEthersProvider()

function providerEventTransaction(

): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        const largeCollateralAdd = txEvent.filterLog(
            LOGADDCOLLATERAL_EVENT,
            YVWETHV2CAULDRON_ADDRESS,
        );

        if (!largeCollateralAdd.length) return findings

        largeCollateralAdd.forEach((largeCollateralDeposit) => {
            const sharesTransferred = new BigNumber(
                largeCollateralDeposit.args.share.toString()
            ).dividedBy(10 ** ETH_DECIMALS);

            const formattedAmount = sharesTransferred.toFixed(2);
            findings.push(
                Finding.fromObject({
                    name: "LogAddCollateral Event in yvWETHv2 Cauldron",
                    description: `${sharesTransferred} shares yvWETH added`,
                    alertId: "ABRA-1",
                    severity: FindingSeverity.Info,
                    type: FindingType.Info,
                    metadata: {
                        from: largeCollateralDeposit.args.from,
                        to: largeCollateralDeposit.args.to,
                        share: largeCollateralDeposit.args.share,
                    },
                })
            );
        });
        return findings;
    };
}

export default {
    providerEventTransaction,
    handleTransaction: providerEventTransaction(),
}
