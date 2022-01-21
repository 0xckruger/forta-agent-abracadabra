import BigNumber from "bignumber.js";
import {
    Finding,
    FindingSeverity,
    FindingType,
    HandleTransaction,
    TransactionEvent
} from "forta-agent";

import {LOGREMOVECOLLATERAL_EVENT, ETH_DECIMALS, CAULDRON_ADDRESS_MAP} from "./constants";

function providerEventTransaction(
    cauldronMap: Map<string,string>
): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        for (let entry of Array.from(cauldronMap.entries())) {
            let cauldronAddress = entry[0];
            let cauldronName = entry[1];
            const collateralRemove = txEvent.filterLog(
                LOGREMOVECOLLATERAL_EVENT,
                cauldronAddress,
            );

            if (!collateralRemove.length) continue

            collateralRemove.forEach((collateralRemove) => {
                const sharesTransferred = new BigNumber(
                    collateralRemove.args.share.toString()
                ).dividedBy(10 ** ETH_DECIMALS);

                const formattedAmount = sharesTransferred.toFixed(2);
                findings.push(
                    Finding.fromObject({
                        name: `LogRemoveCollateral Event in ${cauldronName} Cauldron`,
                        description: `${formattedAmount} shares ${cauldronName} removed`,
                        alertId: "ABRA-2",
                        severity: FindingSeverity.Info,
                        type: FindingType.Info,
                        metadata: {
                            from: collateralRemove.args.from.toString(),
                            to: collateralRemove.args.to.toString(),
                            share: collateralRemove.args.share.toString(),
                        },
                    })
                );
            });
        }
        return findings;
    };
}

export default {
    handleTransaction: providerEventTransaction(CAULDRON_ADDRESS_MAP),
}
