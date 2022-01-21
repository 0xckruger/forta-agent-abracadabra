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

import {LOGADDCOLLATERAL_EVENT, ETH_DECIMALS, CAULDRON_ADDRESS_MAP} from "./constants";

// Define how large the collateral added should be to trigger an event
const LARGE_COLLATERAL_AMT = 1;
// We will need this later to check BentoBox balance
const ethersProvider = getEthersProvider()

function providerEventTransaction(
    cauldronMap: Map<string,string>
): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        for (let entry of Array.from(CAULDRON_ADDRESS_MAP.entries())) {
            let cauldronAddress = entry[0];
            let cauldronName = entry[1];
            const largeCollateralAdd = txEvent.filterLog(
                LOGADDCOLLATERAL_EVENT,
                cauldronAddress,
            );

            if (!largeCollateralAdd.length) continue

            largeCollateralAdd.forEach((largeCollateralDeposit) => {
                const sharesTransferred = new BigNumber(
                    largeCollateralDeposit.args.share.toString()
                ).dividedBy(10 ** ETH_DECIMALS);

                const formattedAmount = sharesTransferred.toFixed(2);
                findings.push(
                    Finding.fromObject({
                        name: `LogAddCollateral Event in ${cauldronName} Cauldron`,
                        description: `${formattedAmount} shares ${cauldronName} added`,
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
    handleTransaction: providerEventTransaction(CAULDRON_ADDRESS_MAP),
}
