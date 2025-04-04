// module mooncl::pool{
//   // use aptos_framework::aptos_coin::AptosCoin;
//   // use aptos_framework::coin;
//   // use aptos_framework::object::{Self, Object};
//   // use std::signer;
//   use std::vector;
//   use std::bcs;
//   // use std::string::{Self, String};
//   use aptos_std::ed25519::{Self, UnvalidatedPublicKey};

//   const Pubkey: vector<u8> = x"f87d46de310897a1a34abab457e7ce3395a3e9a7cff4db0e7ca744440a2d7007";
//   #[event]
//   struct Distributionevent has store, drop{
//     get_s: address
//   }
  
//   fun init_module(account: &signer){

//   }

//   struct Distribution has copy, drop{
//     add: vector<address>,
//     scores: vector<u8>,
//   }

//   public entry fun add_reward(account: &signer, epoch: u8){

//     //rewards_pool::add_rewards(pool, vector::singleton(apt_fa), epoch);
//   }

//   public fun getpubkey(): UnvalidatedPublicKey {
//     ed25519::new_unvalidated_public_key_from_bytes(Pubkey)
//   }

//   #[view]
//   public fun verifySig(sig:vector<u8>):u8{
//     let bytes = bcs::to_bytes(&56);
//     let signature = ed25519::new_signature_from_bytes(sig);
//     let pubkey = getpubkey();
//     let ok = ed25519::signature_verify_strict(&signature, &pubkey, bytes);
//     assert!(ok, 189);
//     86
//   }

//   #[test_only]
//   public fun setup(account: &signer){
//     init_module(account);
//   }
// }

// #[test_only]
// module mooncl::test_pool{
//   use mooncl::pool;
//   use mooncl::ts;
//   use aptos_framework::object::{Self, Object};

//   const Sig:vector<u8> = x"7e81e4dddc9a057764bca477e848fd60f5dceb92153e3cfd5449f77ca0eaba1a3c3c535e8c988127a63ab5c8edc5046d9497944b37647935d06cbabd511fdd02" ;
//   const Pk:vector<u8> = x"f87d46de310897a1a34abab457e7ce3395a3e9a7cff4db0e7ca744440a2d7007";
//   #[test(aptos_framework = @0x1, marketplace = @0x111, seller = @0x222, purchaser = @0x333)]
//   #[expected_failure(abort_code = 0x60001), location = mooncl::ts]
//   public fun tst(aptos_framework: &signer, marketplace: &signer, seller: &signer, purchaser: &signer){
//       ts::setup(aptos_framework, marketplace, seller, purchaser);
//   }

//   #[test]
//   public fun tstsig(){
//     assert!(pool::verifySig(Sig)==86, 300);
//   }
// }