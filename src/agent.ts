import { TransactionEvent } from 'forta-agent'
import addCollateralEvents from './add_collateral_event'
import removeCollateralEvents from './remove_collateral_event'
import { CAULDRON_ADDRESS_MAP } from './constants'

export const provideHandleTransaction = (cauldronMap: Map<string, string>) => {

  return async function handleTransaction(txEvent: TransactionEvent) {
    // Can use one or both event handlers
    const addCollateralHandler = addCollateralEvents.providerEventTransaction(cauldronMap)
    const removeCollateralHandler = removeCollateralEvents.providerEventTransaction(cauldronMap)
    const addCollateralEventFindings = await addCollateralHandler(txEvent)
    const removeCollateralEventFindings = await removeCollateralHandler(txEvent)
    return addCollateralEventFindings.concat(removeCollateralEventFindings)
  }
}


export default {
    handleTransaction: provideHandleTransaction(CAULDRON_ADDRESS_MAP)
}