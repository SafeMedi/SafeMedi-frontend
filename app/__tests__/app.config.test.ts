import type { ConfigContext, ExpoConfig } from "expo/config";

interface AppConfigModule {
  readonly default: (context: ConfigContext) => ExpoConfig;
}

function createConfigContext(config: ExpoConfig): ConfigContext {
  const projectRoot = process.cwd();
  return {
    config,
    projectRoot,
    staticConfigPath: `${projectRoot}/app.json`,
    packageJsonPath: `${projectRoot}/package.json`,
  };
}

function loadAppConfigModule(): AppConfigModule {
  let loadedModule: AppConfigModule | null = null;

  jest.isolateModules(() => {
    loadedModule = require("../../app.config") as AppConfigModule;
  });

  if (!loadedModule) {
    throw new Error("app.config module could not be loaded");
  }

  return loadedModule;
}

describe("app.config", () => {
  const originalClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;

  afterEach(() => {
    process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID = originalClientId;
    jest.resetModules();
  });

  it("기존 managed plugin을 제거하고 필요한 plugin을 추가한다", () => {
    process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID = "test-client-id";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        name: "safeMedi-dev",
        slug: "safeMedi-dev",
        plugins: [
          "expo-font",
          "@mj-studio/react-native-naver-map",
          "expo-location",
          ["expo-build-properties", { android: { compileSdkVersion: 35 } }],
        ],
        ios: {
          infoPlist: {
            ExistingFlag: "keep",
          },
        },
      } as ExpoConfig),
    );

    expect(result.plugins).toEqual(
      expect.arrayContaining([
        "expo-font",
        ["@mj-studio/react-native-naver-map", { client_id: "test-client-id" }],
        [
          "expo-build-properties",
          { android: { extraMavenRepos: ["https://repository.map.naver.com/archive/maven"] } },
        ],
        [
          "expo-location",
          {
            locationAlwaysAndWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
            locationWhenInUsePermission:
              "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
          },
        ],
      ]),
    );

    expect(result.ios?.infoPlist).toEqual(
      expect.objectContaining({
        ExistingFlag: "keep",
        NMFClientId: "test-client-id",
        NMFNcpKeyId: "test-client-id",
      }),
    );
  });

  it("name/slug/infoPlist 값이 없으면 기본값을 채운다", () => {
    process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID = "";
    const configFactory = loadAppConfigModule().default;

    const result = configFactory(
      createConfigContext({
        plugins: [],
      } as unknown as ExpoConfig),
    );

    expect(result.name).toBe("safeMedi");
    expect(result.slug).toBe("safeMedi");
    expect(result.ios?.infoPlist).toEqual(
      expect.objectContaining({
        NMFClientId: "",
        NMFNcpKeyId: "",
        NSLocationWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "현재 위치를 기반으로 지도를 표시하기 위해 위치 접근 권한이 필요합니다.",
      }),
    );
  });
});
