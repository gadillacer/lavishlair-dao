// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockCompound.sol";
import "./IMarketGovernance.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MyGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorTimelockCompound, IMarketGovernance {
    mapping(uint256 => VotedStruct[]) private votedOn;
    address private _boostedContract = address(0);
    uint256 private _boostingPercentage = 1;

    event BoostingView(address tokenAddress, uint256 tokenId, address buyer, address seller, uint256 value);
    event BoostingContractUpdated(address indexed tokenAddress);
    event BoostingPercentageUpdated(uint256 indexed percentage);

    struct VotedStruct {
        address voter;
        uint256 timestamp;
        uint8 support;
    }

    constructor(IVotes _token, ICompoundTimelock _timelock)
        Governor("LVLGovernor")
        GovernorSettings(
            0,
            20,
            0
        )
        GovernorVotes(_token)
        GovernorTimelockCompound(_timelock)
    {}

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 3;
    }

    // The following functions are overrides required by Solidity.

    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockCompound)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function castVote(uint256 proposalId, uint8 support) public override(Governor, IGovernor) returns (uint256) {
        votedOn[proposalId].push(
            VotedStruct(
                msg.sender,
                block.timestamp,
                support
            )
        );
        return super.castVote(proposalId, support);
    }

    function setBoostedContract(address tokenContract) external payable virtual returns (address) {
        require(msg.sender == _executor(), "setBoostedContract is onlyGovernance callable");
        _boostedContract = tokenContract;
        emit BoostingContractUpdated(_boostedContract);
        return _boostedContract;
    }

    function setBoostingPercentage(uint256 percentage) external payable virtual returns (uint256) {
        require(msg.sender == _executor(), "setBoostingPercentage is onlyGovernance callable");
        _boostingPercentage = percentage;
        emit BoostingPercentageUpdated(_boostingPercentage);
        return _boostingPercentage;
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockCompound, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function getVotesOf(uint256 proposalId)
        external
        view
        returns (VotedStruct[] memory)
    {
        return votedOn[proposalId];
    }

    function getBoostingReward(address tokenAddress, uint256 tokenId, address buyer, uint256 value) external virtual override returns(address payable[] memory, uint256[] memory) {
        if (tokenAddress != _boostedContract) {
            address payable[] memory recipients = new address payable[](0);
            uint256[] memory amounts = new uint256[](0);
            return (recipients, amounts);
        }

        address seller = IERC721(tokenAddress).ownerOf(tokenId);
        require(seller != address(0), "Token Owner Not Found");
        
        address payable[] memory recipients = new address payable[](2);
        recipients[0] = payable(address(buyer));
        recipients[1] = payable(address(seller));

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = value * _boostingPercentage / 100;
        amounts[1] = value * _boostingPercentage / 100;

        emit BoostingView(tokenAddress, tokenId, buyer, seller, value);

        return (recipients, amounts);
    }

    function getCurrentBoostingContract() external view override returns (address) {
        return _boostedContract;
    }

    function getBoostingPercentage() external view override returns (uint256) {
        return _boostingPercentage;
    }

    function getExecutorAddress() external view returns (address) {
        return _executor();
    }
}
