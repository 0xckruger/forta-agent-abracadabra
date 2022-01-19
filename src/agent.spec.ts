import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent, TransactionEvent
} from "forta-agent"
import { generalTestFindingGenerator, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
//import { generalTestFindingGenerator, TestTransactionEvent } from "forta-agent-tools";
import { FindingGenerator } from "forta-agent-tools";
import agent from "./agent"
import {YVWETHV2CAULDRON_ADDRESS, LOGADDCOLLATERAL_EVENT, ETH_DECIMALS} from "./constants";
import {metadataVault} from "forta-agent-tools/lib/utils";

describe("Abracadabra Deposit/Withdraw Agent Tests", () => {
  let handleTransaction: HandleTransaction

  const findingGenerator: FindingGenerator = (event?: metadataVault): Finding =>
      Finding.fromObject({
        name: "Abracadabra Agent Test",
        description: "Finding Test",
        alertId: "TEST",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          topics: JSON.stringify(event?.topics),
          data: event?.data,
          address: event?.address,
        },
      });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })
// tests
  describe("handleTransaction", () => {

    let transactionHandler: HandleTransaction

    it("returns empty findings if an empty transaction event is used (but from the right address)", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(YVWETHV2CAULDRON_ADDRESS)

      const findings: Finding[] = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])

    })

    it("returns a finding if passing in multiple correct emissions", async () => {

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(LOGADDCOLLATERAL_EVENT, YVWETHV2CAULDRON_ADDRESS)
      let findings: Finding[] = await handleTransaction(txEvent1);

      const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(LOGADDCOLLATERAL_EVENT, YVWETHV2CAULDRON_ADDRESS)
      findings = findings.concat(await handleTransaction(txEvent2))

      expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1), generalTestFindingGenerator(txEvent2)]);
    })

    it("returns empty finding if an emitted event occurs but in the wrong contract", async() => {

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(LOGADDCOLLATERAL_EVENT, "0x00000000000eAFb5E25c6bDC9f6CB5deadbeef")
      let findings: Finding[] = await handleTransaction(txEvent1);

      expect(findings).toStrictEqual([])
    })

  })
})
