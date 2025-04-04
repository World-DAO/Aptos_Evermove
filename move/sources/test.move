// // #[test_only]
// // module 0x42::test{
// //   #[test]
// //   fun ss(){
// //     let val:u32 = 1;
// //     assert!(val==23, 44);
// //   }
// // }

// #[test_only]
// module mooncl::ts{
//   use std::signer;
//   use std::string;
//   use std::vector;
//   use aptos_framework::account;
//   use aptos_framework::aptos_coin;
//   use aptos_framework::coin;
//   use aptos_framework::object;
//   use mooncl::pool;

//   public inline fun setup(
//         aptos_framework: &signer,
//         marketplace: &signer,
//         seller: &signer,
//         purchaser: &signer,
//     ): (address, address, address) {
//         pool::setup(marketplace);
//         let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

//         let marketplace_addr = signer::address_of(marketplace);
//         account::create_account_for_test(marketplace_addr);
//         coin::register<aptos_coin::AptosCoin>(marketplace);

//         let seller_addr = signer::address_of(seller);
//         account::create_account_for_test(seller_addr);
//         coin::register<aptos_coin::AptosCoin>(seller);

//         let purchaser_addr = signer::address_of(purchaser);
//         account::create_account_for_test(purchaser_addr);
//         coin::register<aptos_coin::AptosCoin>(purchaser);

//         let coins = coin::mint(10000, &mint_cap);
//         coin::deposit(seller_addr, coins);
//         let coins = coin::mint(10000, &mint_cap);
//         coin::deposit(purchaser_addr, coins);

//         coin::destroy_burn_cap(burn_cap);
//         coin::destroy_mint_cap(mint_cap);

//         (marketplace_addr, seller_addr, purchaser_addr)
//     }
// }