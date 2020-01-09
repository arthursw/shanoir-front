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

import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToolService } from '../tool.service';
import { ActivatedRoute } from '@angular/router';
import { File } from '../tree/file-tree.component';
import { DicomArchiveService } from '../../import/shared/dicom-archive.service';
import { EntityComponent } from '../../shared/components/entity/entity.component.abstract';
import { Dataset, DatasetMetadata } from '../../datasets/shared/dataset.model';
import { DatasetService } from '../../datasets/shared/dataset.service';
import { StudyRightsService } from '../../studies/shared/study-rights.service';
import { StudyUserRight } from '../../studies/shared/study-user-right.enum';
import { Page, Pageable } from '../../shared/components/table/pageable.model';
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
    selector: 'boutiques-dataset-detail',
    templateUrl: 'dataset.component.html',
    styleUrls: ['dataset.component.css']
})
export class BoutiquesDatasetComponent extends EntityComponent<Dataset> {

    papayaParams: any;
    private blob: Blob;
    private filename: string;
    hasDownloadRight: boolean = false;
    private hasAdministrateRight: boolean = false;
    files: File[] = [];                                    // JSON structure which describes the files associated with the dataset:
                                                           //  type File: { name: string, path: string, files: File[] }} 
    filesArray: File[] = [];                               // Flattened version of the file tree to display a table
    
    // Table columns definition
    columnDefs = [
        {headerName: "Name", field: "name"},
        {headerName: "URL", field: "url"},
        {headerName: "Format", field: "format"}
    ];

    @ViewChild('fileTable', { static: false }) table: TableComponent;
    
    constructor(
            private toolService: ToolService,
            private datasetService: DatasetService,
            private route: ActivatedRoute,
            private dicomArchiveService: DicomArchiveService,
            private studyRightsService: StudyRightsService) {

        super(route, 'dataset');
        this.mode = "view";
        this.breadcrumbsService.nameStep('Select dataset');
    }

    get dataset(): Dataset { return this.entity; }
    set dataset(dataset: Dataset) { this.entity = dataset; }
    
    initView(): Promise<void> {
        return this.fetchDataset().then(dataset => {

            if (this.keycloakService.isUserAdmin()) {
                this.hasAdministrateRight = true;
                this.hasDownloadRight = true;
                this.loadDicomInMemory();
                this.dataset = dataset;
                this.getFileUrls(dataset.id);
                return;
            } else {
                return this.studyRightsService.getMyRightsForStudy(dataset.studyId).then(rights => {
                    this.hasAdministrateRight = rights.includes(StudyUserRight.CAN_ADMINISTRATE);
                    this.hasDownloadRight = rights.includes(StudyUserRight.CAN_DOWNLOAD);
                    if (this.hasDownloadRight) {
                        this.loadDicomInMemory();
                        this.getFileUrls(dataset.id);
                    }
                    this.dataset = dataset;
                });
            }
        });
    }

    initEdit(): Promise<void> {
        return this.fetchDataset().then(dataset => {
            this.dataset = dataset;
        });
    }

    initCreate(): Promise<void> {
        throw new Error('Cannot create Dataset!');
    }

    getFileUrls(datasetId: number) {
        this.datasetService.getUrls(datasetId).subscribe( (urls)=> this.initFiles(urls) );
    }

    // For now urls comes as { dcm: string[], nii: string[] }
    // Later, it could be a tree of files
    initFiles(urls) {
        // Type of urls is: { 'dcm': urlsOfDicomFiles[], 'nii': urlsOfNiftiFiles[] }
        for(let format in urls) {
            let formatFile = new File(format, format, true);
            for(let url of urls[format]) {
                formatFile.files.push(new File(url, format, false, formatFile))
            }
            // this.filesArray = this.filesArray.concat(formatFile.files);
            if(format == "dcm") {
                this.filesArray.push(new File("DICOM", "dcm", false, formatFile));
            } else {
                this.filesArray = this.filesArray.concat(formatFile.files);
            }
            this.files.push(formatFile);
        }
        this.table.refresh();
    }

    setFile(path) {
        // find Boutiques steps and give appropriate data

        let parameterId = this.toolService.data.currentParameterId;
        let invocation = this.toolService.data.invocation;
        if(this.toolService.data.currentParameterIsList) {
            invocation[parameterId].push(path);
        } else {
            invocation[parameterId] = path;
        }
        this.toolService.saveSession({ invocation: invocation });
        history.go(-2);
    }

    onFileSelected(file: File) {
        // Request dataset to prepare the file
        // Then set the invocation parameter to the returned id
        this.datasetService.prepareUrl(this.dataset.id, file.url, file.parent.format).subscribe( (path)=> this.setFile(path + '/' + (file.name != "DICOM" ? file.name : "")) );
    }

    buildForm(): FormGroup {
        return this.formBuilder.group({});
    }
    
    private fetchDataset(): Promise<Dataset> {
        if (this.mode != 'create') {
            return this.datasetService.get(this.id).then((dataset: Dataset) => {
                if (!dataset.updatedMetadata) dataset.updatedMetadata = new DatasetMetadata();
                return dataset;
            });
        }
    }
    
    download(format: string) {
        this.datasetService.download(this.dataset, format);
    }

    private loadDicomInMemory() {
        this.datasetService.downloadToBlob(this.id, 'dcm').subscribe(blobReponse => {
            this.dicomArchiveService.clearFileInMemory();
            this.dicomArchiveService.importFromZip(blobReponse.body)
                .subscribe(response => {
                    this.dicomArchiveService.extractFileDirectoryStructure()
                    .subscribe(response => {
                        this.initPapaya(response);
                    });
                });
        });
    }

    private initPapaya(dataFiles: any): void {
        let buffs = [];
        Object.keys(dataFiles.files).forEach((key) => {
            buffs.push(dataFiles.files[key].async("arraybuffer"));
        });
        let promiseOfList = Promise.all(buffs);
        promiseOfList.then((values) => {
            let params: object[] = [];
            params['binaryImages'] = [values];
            this.papayaParams = params;
        });
    }

    public hasEditRight(): boolean {
        return this.keycloakService.isUserAdmin() || this.hasAdministrateRight;
    }

    getPage(pageable: Pageable): Promise<Page<File>> {
        let page = new Page<File>();
        page.number = pageable.pageNumber;
        page.size = pageable.pageSize;
        page.numberOfElements = pageable.pageSize;
        page.totalElements = this.filesArray.length;
        page.totalPages = Math.ceil(this.filesArray.length / pageable.pageSize);
        page.content = this.filesArray.slice( (pageable.pageNumber - 1) * pageable.pageSize, pageable.pageNumber * pageable.pageSize);
        return Promise.resolve(page);
    }
}