//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";


/* 
There should be a max of 10,000 CD tokens.
Every Crypto Dev NFT holder should get 10 tokens for free but they would have to pay the gas fees.
The price of one CD at the time of ICO should be 0.001 ether.
There should be a website that users can visit for the ICO.
      // Each NFT would give the user 10 tokens
      // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
      // By default, ERC20 tokens have the smallest denomination of 10^(-18). 
      // This means, having a balance of (1) is actually equal to (10 ^ -18) tokens.
      // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
*/


contract CryptoDevToken is ERC20, Ownable { 
    uint256 public constant tokenPrice = 0.001 ether;

    uint256 public constant tokensPerNFT = 10*10**18;

    uint256 public constant maxTokenSupply = 10000*10**18;

    ICryptoDevs CryptoDevsNFT;

    // Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor (address _cryptoDevsContract) ERC20("Dev Tokens" , "CD") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }


     /**
       * @dev Mints tokens based on the number of NFT's held by the sender
       * Requirements:
       * balance of Crypto Dev NFT's owned by the sender should be greater than 0
       * Tokens should have not been claimed for all the NFTs owned by the sender
       */

    function claim() public {
     address sender = msg.sender;
     uint256 balance = CryptoDevsNFT.balanceOf(sender);
     
     require(balance > 0 , "Sorry, You don't hold any Dev NFTs");

     // amount keeps track of number of unclaimed tokenIds
     uint256 amount = 0;

     for(uint256 i = 0 ; i < balance; i++) {
        uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);

        if(!tokenIdsClaimed[tokenId]) {
         amount += 1 ;
         tokenIdsClaimed[tokenId] = true;
        
        }  
     }

     // If all the token Ids have been claimed, revert the transaction;
     require(amount > 0, "You have already claimed all your Dev Tokens");
      // call the internal function from Openzeppelin's ERC20 contract
      // Mint (amount * 10) tokens for each NFT 
      _mint(msg.sender, amount * tokensPerNFT);  
    }

              /**
       * @dev Mints `amount` number of CryptoDevTokens
       * Requirements:
       * - `msg.value` should be equal or greater than the tokenPrice * amount
       */

      function mint(uint256 amount) public payable {
        uint256 _requiredAmount = amount * tokenPrice;

        require(msg.value >= _requiredAmount, "Insufficient Ether");

        uint256 amountInDecimal = amount * 10 ** 18;
        require((totalSupply()+ amountInDecimal) <= maxTokenSupply , "The total amount exceeds the max supply available");

        _mint(msg.sender, amountInDecimal);

      }

      function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Balance is empty, Nothing to withdraw");

        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");

        require(sent, "Failed to send Ether");

      } 

      receive() external payable {} // Function to receive Ether. msg.data must be empty
      fallback() external payable {} 
}

