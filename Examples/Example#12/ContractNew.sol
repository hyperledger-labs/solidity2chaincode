pragma solidity ^0.4.0;

contract C {
    uint private data;

    function f(uint a) public returns(uint b) { return a + 1; }
    function setData(uint a) public { data = a; }
    function getData() public returns(uint) { return data; }
    function compute(uint a, uint b) public returns (uint) { return a+b; }
}

contract D {
    function readData() public {
        C c = new C();
        uint local = c.f(7); 
        c.setData(3);
        local = c.getData();
        local = c.compute(3, 5); 
    }
}