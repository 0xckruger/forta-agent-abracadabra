import {HandleTransaction, TransactionEvent} from 'forta-agent'
import addCollateralEvents from './add_collateral_event'


let findingsCount = 0

function provideHandleTransaction(): HandleTransaction {

  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings = await addCollateralEvents.handleTransaction(txEvent)
    return findings
  }
}


export default {
    handleTransaction: provideHandleTransaction()
}