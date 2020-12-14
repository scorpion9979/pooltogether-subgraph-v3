import { Address } from '@graphprotocol/graph-ts'

import {Referrer} from "../../generated/schema"

export function loadOrCreateReferrer(
  address: Address
): Referrer {
  let referrer = Referrer.load(address.toHex())

  if (!referrer) {
    referrer = new Referrer(address.toHex())
    referrer.accounts = []
    referrer.save()
  }

  return referrer as Referrer
}
