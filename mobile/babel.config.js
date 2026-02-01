module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            "nativewind/babel",
            [
                "module-resolver",
                {
                    alias: {
                        "react-native-worklets": "./node_modules/react-native-worklets"
                    }
                }
            ],
            "react-native-reanimated/plugin"
        ],
    };
};
