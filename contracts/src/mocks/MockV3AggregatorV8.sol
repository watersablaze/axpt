// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface AggregatorV3InterfaceV8 {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function getRoundData(uint80 _roundId)
        external view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function latestRoundData()
        external view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @notice Minimal 0.8-compatible mock with Chainlink-like surface
contract MockV3AggregatorV8 is AggregatorV3InterfaceV8 {
    uint256 public override version = 1;
    uint8   public override decimals;
    string  private _description;

    uint80  public latestRound;
    int256  public latestAnswer;
    uint256 public latestTimestamp;

    mapping(uint80 => int256)  public getAnswer;
    mapping(uint80 => uint256) public getTimestamp;
    mapping(uint80 => uint256) public getStartedAt;

    constructor(uint8 _decimals, int256 _initialAnswer, string memory desc) {
        decimals = _decimals;
        _description = desc;
        updateAnswer(_initialAnswer);
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function updateAnswer(int256 _answer) public {
        latestRound += 1;
        latestAnswer = _answer;
        latestTimestamp = block.timestamp;

        getAnswer[latestRound]    = _answer;
        getTimestamp[latestRound] = block.timestamp;
        getStartedAt[latestRound] = block.timestamp;
    }

    function updateRoundData(
        uint80 _roundId,
        int256 _answer,
        uint256 _timestamp,
        uint256 _startedAt
    ) external {
        latestRound    = _roundId;
        latestAnswer   = _answer;
        latestTimestamp = _timestamp;

        getAnswer[_roundId]    = _answer;
        getTimestamp[_roundId] = _timestamp;
        getStartedAt[_roundId] = _startedAt;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (
            _roundId,
            getAnswer[_roundId],
            getStartedAt[_roundId],
            getTimestamp[_roundId],
            _roundId
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (
            latestRound,
            latestAnswer,
            getStartedAt[latestRound],
            getTimestamp[latestRound],
            latestRound
        );
    }
}