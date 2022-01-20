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
import {YVWETHV2CAULDRON_ADDRESS, LOGADDCOLLATERAL_EVENT, ETH_DECIMALS, CAULDRON_LIST_ADDRESS, ADDRESS_MAP} from "./constants";

// Define how large the collateral added should be to trigger an event
const LARGE_COLLATERAL_AMT = 1;
// We will need this later to check BentoBox balance
const ethersProvider = getEthersProvider()

function providerEventTransaction(

): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        for (const i in CAULDRON_LIST_ADDRESS) {
            let address = CAULDRON_LIST_ADDRESS[i]
            const largeCollateralAdd = txEvent.filterLog(
                LOGADDCOLLATERAL_EVENT,
                address,
            );

            if (!largeCollateralAdd.length) continue

            largeCollateralAdd.forEach((largeCollateralDeposit) => {
                const sharesTransferred = new BigNumber(
                    largeCollateralDeposit.args.share.toString()
                ).dividedBy(10 ** ETH_DECIMALS);

                const formattedAmount = sharesTransferred.toFixed(2);
                findings.push(
                    Finding.fromObject({
                        name: `LogAddCollateral Event in ${ADDRESS_MAP.get(address)} Cauldron`,
                        description: `${formattedAmount} shares ${ADDRESS_MAP.get(address)} added`,
                        alertId: "ABRA-1",
                        severity: FindingSeverity.Info,
                        type: FindingType.Info,
                        metadata: {
                            from: largeCollateralDeposit.args.from.toString(),
                            to: largeCollateralDeposit.args.to.toString(),
                            share: largeCollateralDeposit.args.share.toString(),
                        },
                    })
                );
            });
        }
        return findings;
    };
}

export default {
    providerEventTransaction,
    handleTransaction: providerEventTransaction(),
}
