import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent, TransactionEvent, keccak256
} from "forta-agent"
import { generalTestFindingGenerator, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
//import { generalTestFindingGenerator, TestTransactionEvent } from "forta-agent-tools";
import {encodeParameters, FindingGenerator} from "forta-agent-tools";
import agent from "./agent"
import {YVWETHV2CAULDRON_ADDRESS, LOGADDCOLLATERAL_EVENT, ETH_DECIMALS} from "./constants";
import {metadataVault} from "forta-agent-tools/lib/utils";
import BigNumber from "bignumber.js";

describe("Abracadabra Deposit/Withdraw Agent Tests", () => {
  let handleTransaction: HandleTransaction

  const findingGenerator: FindingGenerator = (event?: metadataVault): Finding =>
      Finding.fromObject({
        name: "LogAddCollateral Event in yvWETHv2 Cauldron",
        description: `0.00 shares yvWETH added`,
        alertId: "ABRA-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          from: "0xDefC385D7038f391Eb0063C2f7C238cFb55b206C",
          share: "1",
          to: "0xDa1EC4dA97019972759FedA1285878b97FDCC014",
        },
      });

  const simplifiedSignature = "LogAddCollateral(address,address,uint256)"
  const sighashSimplifiedSignature = keccak256(simplifiedSignature)
  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })
// tests
  describe("handleTransaction", () => {

    let transactionHandler: HandleTransaction

    it("returns empty findings if an empty transaction event is used (but from the right address)", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()

      const findings: Finding[] = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])

    })

    it("returns a finding if passing in multiple correct emissions", async () => {

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedSignature,
          YVWETHV2CAULDRON_ADDRESS,
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], ["0xDefC385D7038f391Eb0063C2f7C238cFb55b206C"]),
          encodeParameters(["address"], ["0xDa1EC4dA97019972759FedA1285878b97FDCC014"]),
      )
      let findings: Finding[] = await handleTransaction(txEvent1);

      const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedSignature,
          YVWETHV2CAULDRON_ADDRESS,
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], ["0xDefC385D7038f391Eb0063C2f7C238cFb55b206C"]),
          encodeParameters(["address"], ["0xDa1EC4dA97019972759FedA1285878b97FDCC014"]),
      )
      findings = findings.concat(await handleTransaction(txEvent2))

      expect(findings).toStrictEqual([findingGenerator(txEvent1), findingGenerator(txEvent2)]);
    })

    it("returns empty finding if an emitted event occurs but in the wrong contract", async() => {

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(LOGADDCOLLATERAL_EVENT, "0x00000000000eAFb5E25c6bDC9f6CB5deadbeef")
      let findings: Finding[] = await handleTransaction(txEvent1);

      expect(findings).toStrictEqual([])
    })

  })
})
