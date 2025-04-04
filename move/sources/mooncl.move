module mooncl::moon{
  use std::option::{Self, Option};
  use std::string;
  use aptos_framework::account;
  use aptos_framework::coin::{Self, Coin};
  use aptos_framework::fungible_asset::{Self, FungibleAsset, Metadata};
  use aptos_framework::primary_fungible_store;
  use aptos_framework::timestamp;
  use aptos_framework::object::{Self, Object};

  struct FAConfig has key {
    metadata: Object<Metadata>,
    max_supply: Option<u64>,
  }

  struct FAController has key {
    mint_ref: fungible_asset::MintRef,
    burn_ref: fungible_asset::BurnRef,
    transfer_ref: fungible_asset::TransferRef,
  } 

  fun init_module(deployer: &signer)acquires FAConfig, FAController{
    let token_metadata = &object::create_named_object(deployer, b"mooncl");
    primary_fungible_store::create_primary_store_enabled_fungible_asset(
        token_metadata,
        option::none(),
        string::utf8(b"mooncl"),
        string::utf8(b"mooncl"),
        6,
        string::utf8(b""),
        string::utf8(b""),
    );
    let fa_obj_signer = &object::generate_signer(token_metadata);
    let fa_obj = object::object_from_constructor_ref(token_metadata);
    let mint_ref = fungible_asset::generate_mint_ref(token_metadata);
    let burn_ref = fungible_asset::generate_burn_ref(token_metadata);
    let transfer_ref = fungible_asset::generate_transfer_ref(token_metadata);
    move_to(fa_obj_signer, FAConfig{
      metadata: fa_obj,
      max_supply: option::none()
    });
    move_to(fa_obj_signer, FAController{
      mint_ref, burn_ref, transfer_ref
    });
  }

  public entry fun mint_token(add: address, obj: Object<FAController>){
    let fa_controller = borrow_global<FAController>(fa_obj_addr);
    primary_fungible_store::mint(&fa_controller.mint_ref, sender_addr, 1_000_000);
  }

  public entry fun burn_token(add: address, obj: Object<FAController>){
    let fa_controller = borrow_global<FAController>(fa_obj_addr);
    primary_fungible_store::burn(&fa_controller.burn_ref, sender_addr, 1_000_000);
  }
}