import { Controller } from 'components/fxos-mvc/dist/mvc';

import ListModel from 'js/model/list_model';
import ListView from 'js/view/list_view';

export default class ListController extends Controller {
	constructor() {
		this.model = new ListModel();
		this.view = new ListView();

		this.installedApps = Object.create(null);
	}

	main() {
		this.showList();
	}

	showList() {
		this.view.render();
		document.body.appendChild(this.view.el);

		this.appList = this.model.getAppList();
		this.view.update(this.appList);
		this.view.onAppClick(this.handleAppClick.bind(this));

		this.refreshInstalledList();
	}

	refreshInstalledList() {
		this.installedApps = Object.create(null);
		var req = navigator.mozApps.mgmt.getAll();

		req.onsuccess = () => {
			var apps = req.result;
			var installedApps = Object.create(null);
			apps.forEach(app => {
				installedApps[app.manifestURL] = app;
			});
			for (let manifestURL in this.appList) {
				this.appList[manifestURL].installed = !!installedApps[manifestURL];
				this.appList[manifestURL].mozApp = installedApps[manifestURL] || false;
			}
			this.view.update(this.appList);
		};

		req.onerror = e => {
			console.log('error fetching installed apps: ', e);
		};
	}

	handleAppClick(appData) {
		var manifestURL = appData.manifestURL;
		if (this.appList[manifestURL].mozApp) {
			this.appList[manifestURL].mozApp.launch();
		} else {
			this.installApp(appData);
		}
	}

	installApp(appData) {
		var manifest = appData.manifestURL;
		var type = appData.type;
		var installReq;
		if (type === 'hosted') {
			console.log('installing hosted app, ', manifest);
			installReq = navigator.mozApps.install(manifest, {
				installMetaData: {
					url: appData.url,
					revision: appData.revision
				}
			});
		} else if (type === 'packaged') {
			console.log('installing packaged app, ', manifest);
			installReq = navigator.mozApps.installPackage(manifest, {
				installMetaData: {
					url: appData.url,
					revision: appData.revision
				}
			});
		} else {
			throw new Error('Could not install app, unrecognized type: ' + type);
		}

		installReq.onerror = function(err) {
			console.log('install error', err);
		};
		installReq.onsuccess = () => {
			this.refreshInstalledList();
		};
	}
}
