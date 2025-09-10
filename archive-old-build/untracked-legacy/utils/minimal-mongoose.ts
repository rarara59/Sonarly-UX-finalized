// Minimal mongoose replacement to bypass import hang
export default {
  connect: async (uri: string) => {
    console.log(`✅ Mock mongoose connected to ${uri}`);
    return Promise.resolve();
  },
  connection: {
    readyState: 1
  }
};
