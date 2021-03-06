/**
 * Shanoir NG - Import, manage and share neuroimaging data
 * Copyright (C) 2009-2019 Inria - https://www.inria.fr/
 * Contact us on https://project.inria.fr/shanoir/
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/gpl-3.0.html
 */
import { Component, HostListener } from '@angular/core';

import { BreadcrumbsService } from '../../breadcrumbs/breadcrumbs.service';
import { Router } from '../../breadcrumbs/router';
import { slideDown } from '../../shared/animations/animations';
import * as AppUtils from '../../utils/app.utils';
import { PatientDicom, SerieDicom } from '../shared/dicom-data.model';
import { ImportDataService } from '../shared/import.data-service';
import { ImportService } from '../shared/import.service';


@Component({
    selector: 'select-series',
    templateUrl: 'select-series.component.html',
    styleUrls: ['select-series.component.css', '../shared/import.step.css'],
    animations: [slideDown]
})
export class SelectSeriesComponent {

    patients: PatientDicom[];
    workFolder: string;
    dataFiles: any;
    detailedPatient: Object;
    detailedSerie: Object;
    detailedStudy: Object;
    papayaParams: object[];

    constructor(
            private importService: ImportService,
            private breadcrumbsService: BreadcrumbsService,
            private router: Router,
            private importDataService: ImportDataService) {

        if (!this.importDataService.patientList) {
            this.router.navigate(['imports'], {replaceUrl: true});
            return;
        }
        breadcrumbsService.nameStep('2. Series');
        this.patients = this.importDataService.patientList.patients;
        this.workFolder = this.importDataService.patientList.workFolder;
        if (this.importDataService.inMemoryExtracted) {this.dataFiles = this.importDataService.inMemoryExtracted;}
    }


    showSerieDetails(nodeParams: any, serie: SerieDicom): void {
        this.detailedPatient = null;
        this.detailedStudy = null;
        if (nodeParams && this.detailedSerie && nodeParams.seriesInstanceUID == this.detailedSerie["seriesInstanceUID"]) {
            this.detailedSerie = null;
        } else {
            this.detailedSerie = nodeParams;
            if (serie && serie.images) this.initPapaya(serie); 
        }
    }

    showStudyDetails(nodeParams: any): void {
        this.detailedSerie = null;
        this.detailedPatient = null;
        if (nodeParams && this.detailedStudy && nodeParams.studyID == this.detailedStudy["studyID"]) {
            this.detailedStudy = null;
        } else {
            this.detailedStudy = nodeParams;
        }
    }

    showPatientDetails(nodeParams: any): void {
        this.detailedSerie = null;
        this.detailedStudy = null;
        if (nodeParams && this.detailedPatient && nodeParams.patientID == this.detailedPatient["patientID"]) {
            this.detailedPatient = null;
        } else {
            this.detailedPatient = nodeParams;
        }
    }

    onPatientUpdate(): void {
        this.importDataService.patients = this.patients;
    }

    private initPapaya(serie: SerieDicom): void {
        let listOfPromises;
        if (this.dataFiles) {
            listOfPromises = serie.images.map((image) => {
                return this.dataFiles.files[image.path].async("arraybuffer");
            });
        } else {
            listOfPromises = serie.images.map((image) => {
                let url = AppUtils.BACKEND_API_IMAGE_VIEWER_URL + this.workFolder + '/' + image.path;
                return this.importService.downloadImage(url);
            });
         }
        let promiseOfList = Promise.all(listOfPromises);
        promiseOfList.then((values) => {
            let params: object[] = [];
            params['binaryImages'] = [values];
            this.papayaParams = params;
        });
    }

    get valid(): boolean {
        if (!this.patients || this.patients.length == 0) return false;
        for (let patient of this.patients) {
            for (let study of patient.studies) {
                for (let serie of study.series) {
                    if (serie.selected) return true;
                }
            }
        }
        return false;
    }

    next() {
        this.router.navigate(['imports/context']);
    }

    @HostListener('document:keypress', ['$event']) onKeydownHandler(event: KeyboardEvent) {
        if (event.key == '²') {
            console.log('patients', this.patients);
        }
    }
}