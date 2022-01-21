import BigNumber from "bignumber.js";
import {
    Finding,
    FindingSeverity,
    FindingType,
    HandleTransaction,
    TransactionEvent
} from "forta-agent";

import {LOGADDCOLLATERAL_EVENT, ETH_DECIMALS, CAULDRON_ADDRESS_MAP} from "./constants";

function providerEventTransaction(
    cauldronMap: Map<string,string>
): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        for (let entry of Array.from(cauldronMap.entries())) {
            let cauldronAddress = entry[0];
            let cauldronName = entry[1];
            const collateralAdd = txEvent.filterLog(
                LOGADDCOLLATERAL_EVENT,
                cauldronAddress,
            );

            if (!collateralAdd.length) continue

            collateralAdd.forEach((collateralAdd) => {
                const sharesTransferred = new BigNumber(
                    collateralAdd.args.share.toString()
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
                            from: collateralAdd.args.from.toString(),
                            to: collateralAdd.args.to.toString(),
                            share: collateralAdd.args.share.toString(),
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
