pragma solidity 0.4.24;

import "chainlink/solidity/contracts/Chainlinked.sol";

contract Registry is Chainlinked {
  uint256 constant private ORACLE_PAYMENT = 1 * LINK;

  mapping(address => bytes32) public registry;
  mapping(bytes32 => address) private tempReceipts;

  event AddToRegistry(
    address indexed registrar,
	bytes32 data
  );

  constructor(address _link, address _oracle) public {
    setLinkToken(_link);
    setOracle(_oracle);
  }

  function register(bytes32 _id, string _data) external {
    Chainlink.Request memory req = newRequest(_id, this, this.fulfill.selector);
    req.add("result", _data);
    tempReceipts[chainlinkRequest(req, ORACLE_PAYMENT)] = msg.sender;
  }

  function fulfill(bytes32 _requestId, bytes32 _data)
    public
    recordChainlinkFulfillment(_requestId)
  {
    registry[tempReceipts[_requestId]] = _data;
    if (_data != 0x0) {
      emit AddToRegistry(tempReceipts[_requestId], _data);
    }
    delete tempReceipts[_requestId];
  }
}