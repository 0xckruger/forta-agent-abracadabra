import { TransactionEvent } from 'forta-agent'
import addCollateralEvents from './add_remove_collateral_event'
import { CAULDRON_ADDRESS_MAP } from './constants'

export const provideHandleTransaction = (cauldronMap: Map<string, string>) => {

  return async function handleTransaction(txEvent: TransactionEvent) {
    const addCollateralHandler = addCollateralEvents.providerEventTransaction(cauldronMap)
    const findings = await addCollateralHandler(txEvent)
    return findings
  }
}


export default {
    handleTransaction: provideHandleTransaction(CAULDRON_ADDRESS_MAP)
}