import {HandleTransaction, TransactionEvent} from 'forta-agent'
import addCollateralEvents from './add_collateral_event'
import removeCollateralEvents from './remove_collateral_event'
import { CAULDRON_ADDRESS_MAP } from './constants'

let findingsCount = 0

export const provideHandleTransaction = (cauldronMap: Map<string, string>) => {

  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings1 = await addCollateralEvents.handleTransaction(txEvent)
    const findings2 = await removeCollateralEvents.handleTransaction(txEvent)
    return findings1.concat(findings2)
  }
}


export default {
    handleTransaction: provideHandleTransaction(CAULDRON_ADDRESS_MAP)
}