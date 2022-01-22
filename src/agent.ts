import {ethers, Finding, FindingSeverity, FindingType, getEthersProvider, TransactionEvent} from "forta-agent";
import {
    BENTOBOX_V1_ADDRESS,
    CAULDRON_ADDRESS_MAP,
    ETH_DECIMALS,
    LOGADDCOLLATERAL_EVENT,
    LOGREMOVECOLLATERAL_EVENT
} from "./constants";
import abi from './abi.json'
import erc20ABI from './erc20abi.json'
import BigNumber from "bignumber.js";

const ethersProvider = getEthersProvider();
// The percentage of holdings withdrawn/deposited to/from a cauldron to trigger agent
const PERCENT_THRESHOLD = 0.0001

export const provideHandleTransaction = (ethersProvider: ethers.providers.JsonRpcProvider, cauldronMap: Map<string, string>) => {
    return async function handleTransaction(txEvent: TransactionEvent) {
        const findings: Finding[] = [];

        for (let entry of Array.from(cauldronMap.entries())) {
            let cauldronAddress = entry[0];
            let cauldronName = entry[1];
            const collateralEvent = txEvent.filterLog([LOGADDCOLLATERAL_EVENT, LOGREMOVECOLLATERAL_EVENT], cauldronAddress);
            if (!collateralEvent.length) continue;

            let contract = new ethers.Contract(cauldronAddress, abi, ethersProvider)
            let collateralERC20 = await contract.collateral();
            let wethContract = new ethers.Contract(collateralERC20, erc20ABI, ethersProvider)
            let balanceOfBento = await wethContract.balanceOf(BENTOBOX_V1_ADDRESS)
            let bentoBalanceInt = parseInt(balanceOfBento)


            collateralEvent.forEach((collateralEvent) => {
                const sharesTransferred = new BigNumber(collateralEvent.args.share.toString()).dividedBy(10 ** ETH_DECIMALS);
                const formattedAmount = sharesTransferred.toFixed(2);
                let shareNumber = parseInt(collateralEvent.args.share)
                let percentageChanged = shareNumber / (bentoBalanceInt) * (100)
                console.log(percentageChanged)

                if (percentageChanged > PERCENT_THRESHOLD && collateralEvent.name == "LogAddCollateral") {
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
                if (percentageChanged > PERCENT_THRESHOLD && collateralEvent.name == "LogRemoveCollateral") {
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
    handleTransaction: provideHandleTransaction(ethersProvider, CAULDRON_ADDRESS_MAP),
};
