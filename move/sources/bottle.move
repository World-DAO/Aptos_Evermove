module mooncl::bottle {
    use std::signer;
    use std::string;
    use aptos_std::table::{Self, Table};
    use aptos_framework::timestamp;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::object::{Self, ExtendRef};
    use aptos_framework::coin;

    const ENO_MESSAGE: u64 = 0;
    const ENOT_ADMIN: u64 = 1;
    const ENOT_BOTTLE: u64 = 2;
    const ENOT_LENGEQUAL: u64 = 3;

    const ADMIN_ADDRESS: address = @0xf87d46de310897a1a34abab457e7ce3395a3e9a7cff4db0e7ca744440a2d7007;

    struct Epochpool has store{
      amount: u64,
      store: address,
      store_extend_ref: ExtendRef,
    }

    struct Score has store{
      bottleScore: Table<address, u64>,
      userScore: Table<address, u64>,
      is_drawn: Table<address, bool>,
      totalScore: u64,
    }
    
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Bottle has key{
      sender: address,
      content: string::String,
      time: u64,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Prize_pool has key{
      epoch_rewards: Table<u8, Epochpool>,
      epoch_score: Table<u8, Score>,
      epoch: u8
    }

    fun init_module(deployer: &signer) {
      let userScore = table::new<address, u64>();
      let bottleScore = table::new<address, u64>();
      let is_drawn = table::new<address, bool>();
      let score = Score{userScore, bottleScore, is_drawn, totalScore:0};

      let constructor_ref = object::create_named_object(deployer, b"mooncl");
      let listing_signer = object::generate_signer(&constructor_ref);
      let extend_ref = object::generate_extend_ref(&constructor_ref);
      let objAdd = signer::address_of(&listing_signer);
      coin::register<AptosCoin>(&listing_signer);

      let epochPool = Epochpool{
        amount: 0,
        store: objAdd,
        store_extend_ref: extend_ref 
      };

      let epoch_rewards = table::new<u8, Epochpool>();
      epoch_rewards.add(0, epochPool);
      let epoch_score = table::new<u8, Score>();
      epoch_score.add(0, score);
      move_to(deployer, Prize_pool{
        epoch_rewards,
        epoch_score,
        epoch: 0
      });
    }

    public entry fun generate_bottle(account: &signer, _content: string::String)acquires Prize_pool{
      let add = signer::address_of(account);
      add_reward(account, 100_000_000);
      let constructor_ref = object::create_object(add);
      let signer_ref = object::generate_signer(&constructor_ref);
      move_to(&signer_ref, Bottle{sender: add, content:_content, time: timestamp::now_seconds()});
      //object::address_to_object(signer::address_of(&sign))
    }

    public entry fun setScore(bottles: vector<address>, scores: vector<u64>)acquires Prize_pool{
      let len = std::vector::length(&bottles);
      assert!(std::vector::length(&bottles)!=std::vector::length(&scores), ENOT_LENGEQUAL);
      let pool = borrow_global_mut<Prize_pool>(@mooncl);
      let epoch = pool.epoch;
      let e_score: &mut Table<u8, Score> = &mut pool.epoch_score;
      let scoreStruct = table::borrow_mut<u8, Score>(e_score, epoch);
      let scoreTable = &mut scoreStruct.bottleScore;
      let i = 0;
      while (i < len) {
        i = i + 1;
        let bottleadd = std::vector::borrow(&bottles, i);
        assert!(exists<Bottle>(*bottleadd), ENOT_BOTTLE);
        let score = std::vector::borrow(&scores, i);
        if(table::contains(scoreTable, *bottleadd)){
          let curscore = table::borrow(scoreTable, *bottleadd);
          let setS = *curscore as u64;
          let newscore = setS - *curscore;
          scoreStruct.totalScore = scoreStruct.totalScore + newscore; 
          table::upsert(scoreTable, *bottleadd, newscore);
        }else{
          table::add(scoreTable, *bottleadd, *score);
          scoreStruct.totalScore = scoreStruct.totalScore + *score;
        }
      }
    }

    public entry fun newEpoch(account: &signer)acquires Prize_pool{
      let add = signer::address_of(account);
      assert!(add == ADMIN_ADDRESS, ENOT_ADMIN);
      let pool = borrow_global_mut<Prize_pool>(@mooncl);
      let newEpoch = pool.epoch + 1;
      pool.epoch = newEpoch;

      let constructor_ref = object::create_object(@mooncl);
      let userScore = table::new<address, u64>();
      let bottleScore = table::new<address, u64>();
      let is_drawn = table::new<address, bool>();
      let score = Score{userScore, bottleScore, is_drawn, totalScore:0};
      let lsigner = object::generate_signer(&constructor_ref);
      let extend_ref = object::generate_extend_ref(&constructor_ref);
      let objAdd = signer::address_of(&lsigner);
      coin::register<AptosCoin>(&lsigner);

      let epochPool = Epochpool{
        amount: 0,
        store: objAdd,
        store_extend_ref: extend_ref 
      };
      let reward = &mut pool.epoch_rewards; 
      let _score = &mut pool.epoch_score;
      table::add(reward, newEpoch, epochPool);
      table::add(_score, newEpoch, score);
    }
    
    fun add_reward(account: &signer, amount:u64)acquires Prize_pool{
      let coins = coin::withdraw<AptosCoin>(account, amount);
      let pool = borrow_global_mut<Prize_pool>(@mooncl);
      let epoch = pool.epoch;
      let reward_table = &mut pool.epoch_rewards;
      let reward_pool = table::borrow_mut(reward_table, epoch);
      let obj = reward_pool.store;
      coin::deposit<AptosCoin>(obj, coins);
      reward_pool.amount = reward_pool.amount + 100_000_000;
    }

    #[view]
    public fun address_epoch_score(addr: address, epoch: u8):u64 acquires Prize_pool{
      let pool = borrow_global<Prize_pool>(@mooncl);
      let score = &pool.epoch_score;
      let user = table::borrow(score, epoch);
      *table::borrow(&user.userScore, addr)
    }

    #[view]
    public fun bottle_score(bottle: address, epoch: u8):u64 acquires Prize_pool{
      assert!(exists<Bottle>(bottle), ENOT_BOTTLE);
      let pool = borrow_global<Prize_pool>(@mooncl);
      let score = &pool.epoch_score;
      let bot = table::borrow(score, epoch);
      *table::borrow(&bot.bottleScore, bottle)
    }

    #[view]
    public fun getPrize(addr: address, epoch: u8):u64 acquires Prize_pool{
      let pool = borrow_global<Prize_pool>(@mooncl);
      let reward = &pool.epoch_rewards;
      let rewardt = table::borrow(reward, epoch);
      let score = &pool.epoch_score;
      let scoret = table::borrow(score, epoch);
      let scoreuser = table::borrow(&scoret.userScore, addr);
      let scoreamount = scoret.totalScore;
      let aptamount = rewardt.amount;
      aptamount*(*scoreuser/scoreamount)
    }

    public entry fun claim(account: &signer, epoch: u8)acquires Prize_pool{
      let add = signer::address_of(account);
      let pool = borrow_global_mut<Prize_pool>(@mooncl);
      let s = table::borrow_mut(&mut pool.epoch_score, epoch);
      table::upsert(&mut s.is_drawn, add, true);
      let reward_row = table::borrow(&pool.epoch_rewards, epoch);
      let sc = table::borrow(&pool.epoch_score, epoch);

      let user_score_ref = table::borrow(&sc.userScore, add);
      let user_score = *user_score_ref;
      let total_score = sc.totalScore;
      let apt_amount = reward_row.amount;
      let prize = apt_amount * (user_score / total_score);
      let r = table::borrow(&pool.epoch_rewards, epoch);
      let obj_signer = object::generate_signer_for_extending(&r.store_extend_ref);
      let coins = coin::withdraw<AptosCoin>(&obj_signer, prize);
      coin::deposit<AptosCoin>(add, coins);
    }

    #[test_only]
    use aptos_framework::account;
    #[test_only]
    use aptos_framework::aptos_coin;
    #[test(aptos_framework = @0x1, admin = @0xa1, user1 = @0xa2)]
    public entry fun test_bottle_flow(
        aptos_framework: &signer,
        admin: &signer,
        user1: &signer,
    )acquires Prize_pool {
        init_for_test(admin);
        let user = signer::address_of(user1);
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        account::create_account_for_test(user);
        coin::register<AptosCoin>(user1);
        let coins = coin::mint(1000000000, &mint_cap);
        coin::deposit(user, coins);

        newEpoch(admin);
        generate_bottle(user1, string::utf8(b"Hello from user1"));

        let addrs = vector[ signer::address_of(user1)];
        let scrs = vector[ 10 ];
        let new_score = address_epoch_score(user, 0);
        assert!(new_score == 10, 3);

        let prize_amt = getPrize(user, 0);

        claim(user1, 0);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test_only]
    public entry fun init_for_test(admin: &signer) {
        init_module(admin);
    }
}
