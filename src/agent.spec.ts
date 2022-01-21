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
const defaultShare = new BigNumber(1)
const defaultCauldron = "0x7b7473a76D6ae86CE19f7352A1E89F6C9dc39020"

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

    const createRemoveCollateralFinding = (from: string, to: string, share: BigNumber, shareName: string) =>
        Finding.fromObject({
            name: `LogRemoveCollateral Event in ${shareName} Cauldron`,
            description: `${new BigNumber (
                share.toString()).
            dividedBy(10 ** 18).
            toFixed(2)} shares ${shareName} removed`,
            alertId: "ABRA-2",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
                from: from,
                share: share.toString(),
                to: to,
            },
        });

  // Change to any test bank of address:string map
  const cauldronMap: Map<string, string> = CAULDRON_ADDRESS_MAP
  beforeAll(() => {
    handleTransaction = provideHandleTransaction(cauldronMap)
  })

  describe("handleTransaction", () => {
      it("returns empty findings if an empty transaction event is used (but from the right address)", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()

      const findings: Finding[] = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])

    })

    it("returns a finding if passing in a correct ADD emission", async () => {
      const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
          simplifiedAddSignature,
          defaultCauldron,
          encodeParameters(["uint256"], [1]),
          encodeParameters(["address"], [fromAddress]),
          encodeParameters(["address"], [toAddress]),
      )
      let findings: Finding[] = await handleTransaction(txEvent1);

     let cauldronName = cauldronMap.get(defaultCauldron);
      expect(findings).toStrictEqual([
          createAddCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronName))]);
    })

      it("returns a finding if passing in a correct REMOVE emission", async () => {
          const aclxCauldronAddress: string = "0x7b7473a76D6ae86CE19f7352A1E89F6C9dc39020";

          const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
              simplifiedRemoveSignature,
              aclxCauldronAddress,
              encodeParameters(["uint256"], [1]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          )
          let findings: Finding[] = await handleTransaction(txEvent1);

          let cauldronName = cauldronMap.get(aclxCauldronAddress);
          expect(findings).toStrictEqual([
              createRemoveCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronName))]);
      })

      it("returns a not equal when passing in an ADD event and comparing to a REMOVE finding", async() => {
          const share = new BigNumber(1)
          const aclxCauldronAddress: string = "0x7b7473a76D6ae86CE19f7352A1E89F6C9dc39020";

          const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
              simplifiedAddSignature,
              aclxCauldronAddress,
              encodeParameters(["uint256"], [1]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          )
          let findings: Finding[] = await handleTransaction(txEvent1);

          let cauldronName = cauldronMap.get(aclxCauldronAddress);
          expect(findings).not.toStrictEqual([
              createRemoveCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronName))]);
      })

    it("returns multiple findings if multiple event emissions occurred", async () => {
        const share1 = new BigNumber(1)
        const share2 = new BigNumber(2)
        const aclxCauldronAddress: string = "0x7b7473a76D6ae86CE19f7352A1E89F6C9dc39020";

        const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
            simplifiedAddSignature,
            aclxCauldronAddress,
            encodeParameters(["uint256"], [1]),
            encodeParameters(["address"], [fromAddress]),
            encodeParameters(["address"], [toAddress]),
        ).addEventLog(
            simplifiedAddSignature,
            aclxCauldronAddress,
            encodeParameters(["uint256"], [2]),
            encodeParameters(["address"], [fromAddress]),
            encodeParameters(["address"], [toAddress]),
        )

        let findings: Finding[] = await handleTransaction(txEvent1);
        let cauldronName = cauldronMap.get(aclxCauldronAddress);
        expect(findings).toStrictEqual([
            createAddCollateralFinding(fromAddress, toAddress, share1, String(cauldronName)), createAddCollateralFinding(fromAddress, toAddress, share2, String(cauldronName))]);
    })

      it("returns multiple findings if both ADD and REMOVE event emissions occurred", async () => {
          const share1 = new BigNumber(1)
          const share2 = new BigNumber(2)

          const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
              simplifiedAddSignature,
              defaultCauldron,
              encodeParameters(["uint256"], [1]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          ).addEventLog(
              simplifiedRemoveSignature,
              defaultCauldron,
              encodeParameters(["uint256"], [2]),
              encodeParameters(["address"], [fromAddress]),
              encodeParameters(["address"], [toAddress]),
          )

          let findings: Finding[] = await handleTransaction(txEvent1);
          let cauldronName = cauldronMap.get(defaultCauldron);
          expect(findings).toStrictEqual([
              createAddCollateralFinding(fromAddress, toAddress, share1, String(cauldronName)), createRemoveCollateralFinding(fromAddress, toAddress, share2, String(cauldronName))]);
      })



    it("returns a finding for every known cauldron address given an emission", async() => {
        let TransactionEvent;
        for (let entry of Array.from(cauldronMap.entries())) {
            let cauldronAddress = entry[0];
            let cauldronName = entry[1];

            let txEvent = TransactionEvent = new TestTransactionEvent().addEventLog(
                simplifiedAddSignature,
                cauldronAddress,
                encodeParameters(["uint256"], [1]),
                encodeParameters(["address"], [fromAddress]),
                encodeParameters(["address"], [toAddress]),
            )

            let findings: Finding[] = await handleTransaction(txEvent);
            expect(findings).toStrictEqual([
                createAddCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronName))
            ])
        }
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

        let cauldronNameFTM = cauldronMap.get("0x05500e2Ee779329698DF35760bEdcAAC046e7C27");
        let cauldronNameWBTC = cauldronMap.get("0x5ec47EE69BEde0b6C2A2fC0D9d094dF16C192498")
        expect(findings[0]).toStrictEqual(
            createAddCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronNameFTM))
        )
        expect(findings[1]).toStrictEqual(
            createAddCollateralFinding(fromAddress, toAddress, defaultShare, String(cauldronNameWBTC)))
        })
  })
})
