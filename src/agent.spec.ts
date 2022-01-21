import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent"
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { encodeParameters } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent"
import { CAULDRON_ADDRESS_MAP } from "./constants";
import BigNumber from "bignumber.js";

// Test constants
const fromAddress = "0xDefC385D7038f391Eb0063C2f7C238cFb55b206C" // Test from address
const toAddress = "0xDa1EC4dA97019972759FedA1285878b97FDCC014" // Test to address
const simplifiedAddSignature = "LogAddCollateral(address,address,uint256)"
const simplifiedRemoveSignature = "LogRemoveCollateral(address,address,uint256)"

describe("Abracadabra Deposit/Withdraw Agent Tests", () => {
  let handleTransaction: HandleTransaction

  const createAddCollateralFinding = (from: string, to: string, share: BigNumber, shareName: string) =>
      Finding.fromObject({
        name: `LogAddCollateral Event in ${shareName} Cauldron`,
        description: `${new BigNumber (
            share.toString()).
            dividedBy(10 ** 18).
            toFixed(2)} shares ${shareName} added`,
        alertId: "ABRA-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          from: from,
          share: share.toString(),
          to: to,
        },
      });

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(CAULDRON_ADDRESS_MAP)
  })

  describe("handleTransaction", () => {
      it("returns empty findings if an empty transaction event is used (but from the right address)", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()

      const findings: Finding[] = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])

    })

    it("returns a finding if passing in multiple correct emissions", async () => {
      const share = new BigNumber(1)

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedAddSignature,
          "0x920D9BD936Da4eAFb5E25c6bDC9f6CB528953F9f",
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], [fromAddress]),
          encodeParameters(["address"], [toAddress]),
      )
      let findings: Finding[] = await handleTransaction(txEvent1);

      const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedAddSignature,
          "0x920D9BD936Da4eAFb5E25c6bDC9f6CB528953F9f",
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], [fromAddress]),
          encodeParameters(["address"], [toAddress]),
      )
      findings = findings.concat(await handleTransaction(txEvent2))

     let cauldronName = CAULDRON_ADDRESS_MAP.get("0x920D9BD936Da4eAFb5E25c6bDC9f6CB528953F9f");
      expect(findings).toStrictEqual([
          createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronName)), createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronName))]);
    })

    it("returns empty finding if an emitted event occurs but in the wrong contract", async() => {

      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedAddSignature,
          "0x00000000000eAFb5E25c6bDC9f6CB5deadbeef",
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], [fromAddress]),
          encodeParameters(["address"], [toAddress]),
      )
      let findings: Finding[] = await handleTransaction(txEvent1);

      expect(findings).toStrictEqual([])
    })

    it("returns correct findings for cauldrons with different addresses and correct event emissions", async () => {

        const share = new BigNumber(1)

        const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
            simplifiedAddSignature,
            "0x05500e2Ee779329698DF35760bEdcAAC046e7C27",
            encodeParameters(["uint256"], [1]),
            encodeParameters(["address"], [fromAddress]),
            encodeParameters(["address"], [toAddress]),
        )
        let findings: Finding[] = await handleTransaction(txEvent1);

        const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(
            simplifiedAddSignature,
            "0x5ec47EE69BEde0b6C2A2fC0D9d094dF16C192498",
            encodeParameters(["uint256"], [1]),
            encodeParameters(["address"], [fromAddress]),
            encodeParameters(["address"], [toAddress]),
        )
        findings = findings.concat(await handleTransaction(txEvent2))

        let cauldronNameFTM = CAULDRON_ADDRESS_MAP.get("0x05500e2Ee779329698DF35760bEdcAAC046e7C27");
        let cauldronNameWBTC = CAULDRON_ADDRESS_MAP.get("0x5ec47EE69BEde0b6C2A2fC0D9d094dF16C192498")
        expect(findings).toStrictEqual([
            createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronNameFTM)), createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronNameWBTC))]);
        })

      it("returns correct findings for cauldrons emitting remove events", async () => {

          const share = new BigNumber(1)

          const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
              simplifiedAddSignature,
              "0x05500e2Ee779329698DF35760bEdcAAC046e7C27",
              encodeParameters(["uint256"], [1]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          )
          let findings: Finding[] = await handleTransaction(txEvent1);

          const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(
              simplifiedAddSignature,
              "0x5ec47EE69BEde0b6C2A2fC0D9d094dF16C192498",
              encodeParameters(["uint256"], [1]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          )
          findings = findings.concat(await handleTransaction(txEvent2))

          let cauldronNameFTM = CAULDRON_ADDRESS_MAP.get("0x05500e2Ee779329698DF35760bEdcAAC046e7C27");
          let cauldronNameWBTC = CAULDRON_ADDRESS_MAP.get("0x5ec47EE69BEde0b6C2A2fC0D9d094dF16C192498")
          expect(findings).toStrictEqual([
              createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronNameFTM)), createAddCollateralFinding(fromAddress, toAddress, share, String(cauldronNameWBTC))]);
      })

  })
})
