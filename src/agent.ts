import {Finding, FindingSeverity, FindingType, TransactionEvent} from "forta-agent";
import {CAULDRON_ADDRESS_MAP, ETH_DECIMALS, LOGADDCOLLATERAL_EVENT, LOGREMOVECOLLATERAL_EVENT} from "./constants";
import BigNumber from "bignumber.js";

export const provideHandleTransaction = (cauldronMap: Map<string, string>) => {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    for (let entry of Array.from(cauldronMap.entries())) {
      let cauldronAddress = entry[0];
      let cauldronName = entry[1];
      const collateralEvent = txEvent.filterLog([LOGADDCOLLATERAL_EVENT, LOGREMOVECOLLATERAL_EVENT], cauldronAddress);
      if (!collateralEvent.length) continue;

      collateralEvent.forEach((collateralEvent) => {
        const sharesTransferred = new BigNumber(collateralEvent.args.share.toString()).dividedBy(10 ** ETH_DECIMALS);
        const formattedAmount = sharesTransferred.toFixed(2);

        if (collateralEvent.name == "LogAddCollateral") {
          findings.push(
              Finding.fromObject({
                name: `${collateralEvent.name} Event in ${cauldronName} Cauldron`,
                description: `${formattedAmount} shares ${cauldronName} added`,
                alertId: "ABRA-1",
                severity: FindingSeverity.Info,
                type: FindingType.Info,
                metadata: {
                  from: collateralEvent.args.from.toString(),
                  to: collateralEvent.args.to.toString(),
                  share: collateralEvent.args.share.toString(),
                },
              })
          );
        }
        if (collateralEvent.name == "LogRemoveCollateral") {
          findings.push(
              Finding.fromObject({
                name: `LogRemoveCollateral Event in ${cauldronName} Cauldron`,
                description: `${formattedAmount} shares ${cauldronName} removed`,
                alertId: "ABRA-2",
                severity: FindingSeverity.Info,
                type: FindingType.Info,
                metadata: {
                  from: collateralEvent.args.from.toString(),
                  to: collateralEvent.args.to.toString(),
                  share: collateralEvent.args.share.toString(),
                },
              })
          );
        }
      });
    }
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CAULDRON_ADDRESS_MAP),
};
