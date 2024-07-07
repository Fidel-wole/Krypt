require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.24',
  networks: {
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/RP6ESRxtP35-Bn2-6vZXMSURkOJF-LBR',
      accounts: ['caa3896a6400f3cb44c29fdd1d43de30e5d7653253347adf0b8e31c854ed4e5d'],
    },
  },
};