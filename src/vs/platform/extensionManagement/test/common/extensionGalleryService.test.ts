/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { joinPath } from '../../../../base/common/resources.js';
import { URI } from '../../../../base/common/uri.js';
import { isUUID } from '../../../../base/common/uuid.js';
import { mock } from '../../../../base/test/common/mock.js';
import { IConfigurationService } from '../../../configuration/common/configuration.js';
import { TestConfigurationService } from '../../../configuration/test/common/testConfigurationService.js';
import { IEnvironmentService } from '../../../environment/common/environment.js';
import {
	IRawGalleryExtensionVersion,
	sortExtensionVersions,
} from '../../common/extensionGalleryService.js';
import { IFileService } from '../../../files/common/files.js';
import { FileService } from '../../../files/common/fileService.js';
import { InMemoryFileSystemProvider } from '../../../files/common/inMemoryFilesystemProvider.js';
import { NullLogService } from '../../../log/common/log.js';
import product from '../../../product/common/product.js';
import { IProductService } from '../../../product/common/productService.js';
import { resolveMarketplaceHeaders } from '../../../externalServices/common/marketplace.js';
import { InMemoryStorageService, IStorageService } from '../../../storage/common/storage.js';
import {
	TelemetryConfiguration,
	TELEMETRY_SETTING_ID,
} from '../../../telemetry/common/telemetry.js';
import { TargetPlatform } from '../../../extensions/common/extensions.js';
import { NullTelemetryService } from '../../../telemetry/common/telemetryUtils.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';

class EnvironmentServiceMock extends mock<IEnvironmentService>() {
	override readonly serviceMachineIdResource: URI;
	constructor(serviceMachineIdResource: URI) {
		super();
		this.serviceMachineIdResource = serviceMachineIdResource;
		this.isBuilt = true;
	}
}

suite('Extension Gallery Service', () => {
	const disposables = ensureNoDisposablesAreLeakedInTestSuite();
	let fileService: IFileService,
		environmentService: IEnvironmentService,
		storageService: IStorageService,
		productService: IProductService,
		configurationService: IConfigurationService;

	setup(() => {
		const serviceMachineIdResource = joinPath(
			URI.file('tests').with({ scheme: 'vscode-tests' }),
			'machineid'
		);
		environmentService = new EnvironmentServiceMock(serviceMachineIdResource);
		fileService = disposables.add(new FileService(new NullLogService()));
		const fileSystemProvider = disposables.add(new InMemoryFileSystemProvider());
		disposables.add(
			fileService.registerProvider(serviceMachineIdResource.scheme, fileSystemProvider)
		);
		storageService = disposables.add(new InMemoryStorageService());
		configurationService = new TestConfigurationService({
			[TELEMETRY_SETTING_ID]: TelemetryConfiguration.ON,
		});
		configurationService.updateValue(TELEMETRY_SETTING_ID, TelemetryConfiguration.ON);
		productService = { _serviceBrand: undefined, ...product, enableTelemetry: true };
	});

	test('marketplace machine id', async () => {
		const headers = await resolveMarketplaceHeaders(
			product.version,
			productService,
			environmentService,
			configurationService,
			fileService,
			storageService,
			NullTelemetryService
		);
		assert.ok(headers['X-Market-User-Id']);
		assert.ok(isUUID(headers['X-Market-User-Id']));
		const headers2 = await resolveMarketplaceHeaders(
			product.version,
			productService,
			environmentService,
			configurationService,
			fileService,
			storageService,
			NullTelemetryService
		);
		assert.strictEqual(headers['X-Market-User-Id'], headers2['X-Market-User-Id']);
	});

	test('sorting single extension version without target platform', async () => {
		const actual = [aExtensionVersion('1.1.2')];
		const expected = [...actual];
		sortExtensionVersions(actual, TargetPlatform.DARWIN_X64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting single extension version with preferred target platform', async () => {
		const actual = [aExtensionVersion('1.1.2', TargetPlatform.DARWIN_X64)];
		const expected = [...actual];
		sortExtensionVersions(actual, TargetPlatform.DARWIN_X64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting single extension version with not compatible target platform', async () => {
		const actual = [aExtensionVersion('1.1.2', TargetPlatform.DARWIN_ARM64)];
		const expected = [...actual];
		sortExtensionVersions(actual, TargetPlatform.WIN32_X64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting multiple extension versions without target platforms', async () => {
		const actual = [
			aExtensionVersion('1.2.4'),
			aExtensionVersion('1.1.3'),
			aExtensionVersion('1.1.2'),
			aExtensionVersion('1.1.1'),
		];
		const expected = [...actual];
		sortExtensionVersions(actual, TargetPlatform.WIN32_ARM64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting multiple extension versions with target platforms - 1', async () => {
		const actual = [
			aExtensionVersion('1.2.4', TargetPlatform.DARWIN_ARM64),
			aExtensionVersion('1.2.4', TargetPlatform.WIN32_ARM64),
			aExtensionVersion('1.2.4', TargetPlatform.LINUX_ARM64),
			aExtensionVersion('1.1.3'),
			aExtensionVersion('1.1.2'),
			aExtensionVersion('1.1.1'),
		];
		const expected = [actual[1], actual[0], actual[2], actual[3], actual[4], actual[5]];
		sortExtensionVersions(actual, TargetPlatform.WIN32_ARM64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting multiple extension versions with target platforms - 2', async () => {
		const actual = [
			aExtensionVersion('1.2.4'),
			aExtensionVersion('1.2.3', TargetPlatform.DARWIN_ARM64),
			aExtensionVersion('1.2.3', TargetPlatform.WIN32_ARM64),
			aExtensionVersion('1.2.3', TargetPlatform.LINUX_ARM64),
			aExtensionVersion('1.1.2'),
			aExtensionVersion('1.1.1'),
		];
		const expected = [actual[0], actual[3], actual[1], actual[2], actual[4], actual[5]];
		sortExtensionVersions(actual, TargetPlatform.LINUX_ARM64);
		assert.deepStrictEqual(actual, expected);
	});

	test('sorting multiple extension versions with target platforms - 3', async () => {
		const actual = [
			aExtensionVersion('1.2.4'),
			aExtensionVersion('1.1.2'),
			aExtensionVersion('1.1.1'),
			aExtensionVersion('1.0.0', TargetPlatform.DARWIN_ARM64),
			aExtensionVersion('1.0.0', TargetPlatform.WIN32_ARM64),
		];
		const expected = [actual[0], actual[1], actual[2], actual[4], actual[3]];
		sortExtensionVersions(actual, TargetPlatform.WIN32_ARM64);
		assert.deepStrictEqual(actual, expected);
	});

	function aExtensionVersion(
		version: string,
		targetPlatform?: TargetPlatform
	): IRawGalleryExtensionVersion {
		return { version, targetPlatform } as IRawGalleryExtensionVersion;
	}
});
