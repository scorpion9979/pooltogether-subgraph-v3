import { log, Address } from '@graphprotocol/graph-ts'
import {PrizePoolAccount} from "../../generated/schema"
import {loadOrCreateAccount} from "../helpers/loadOrCreateAccount"
import {loadOrCreateReferrer} from "../helpers/loadOrCreateReferrer"
import {ZERO} from "./common"

export function loadOrCreatePrizePoolAccount(
    prizePool: Address,
    accountId: string,
    referrerId: string = "0x0000000000000000000000000000000000000000",
  ): PrizePoolAccount {
    let prizePoolAccount = PrizePoolAccount.load(generateCompositeId(prizePool.toHex(),accountId))
    let account = loadOrCreateAccount(Address.fromString(accountId))
    let referrer = loadOrCreateReferrer(Address.fromString(referrerId))
    if(!account.referrers.includes(referrer.id)) {
      account.referrers = account.referrers.concat([referrer.id])
      referrer.accounts = referrer.accounts.concat([account.id])
      referrer.save()
      account.save()
    }

    if(!prizePoolAccount){ // create 
      prizePoolAccount = new PrizePoolAccount(generateCompositeId(prizePool.toHex(),accountId))
      prizePoolAccount.prizePool = prizePool.toHex()
      prizePoolAccount.account = accountId
      
      prizePoolAccount.timelockedBalance = ZERO
      prizePoolAccount.cumulativeWinnings = ZERO
      prizePoolAccount.unlockTimestamp = ZERO
      
      prizePoolAccount.save()
    }
    return prizePoolAccount as PrizePoolAccount
  }

  function generateCompositeId(accountId : string, controlledTokenId: string) :string{
    return accountId + "-" + controlledTokenId
  }

