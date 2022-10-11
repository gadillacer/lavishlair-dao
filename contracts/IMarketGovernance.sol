// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// @author: lavishlair.xyz

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @dev Lookup engine interface
 */
interface IMarketGovernance is IERC165 {

    /**
     * Get the boosting reward for a given token (address, id) and value amount.  Does not cache the bps/amounts.  Caches the spec for a given token address
     * 
     * @param tokenAddress - The address of the token
     * @param tokenId      - The id of the token
     * @param buyer        - The address of the token's buyer
     * @param value        - The value you wish to get the boosting reward of
     *
     * returns Two arrays of equal length, reward recipients and the corresponding amount each recipient should get
     */
    function getBoostingReward(address tokenAddress, uint256 tokenId, address buyer, uint256 value) external returns (address payable[] memory recipients, uint256[] memory amounts);
    function getCurrentBoostingContract() external view returns (address);
    function getBoostingPercentage() external view returns (uint256);
}