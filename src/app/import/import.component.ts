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
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbsService } from '../breadcrumbs/breadcrumbs.service';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { StudyRightsService } from '../studies/shared/study-rights.service';


@Component({
    selector: 'imports',
    templateUrl: 'import.component.html',
    styleUrls: ['import.component.css']
})
export class ImportComponent implements OnInit {

    private importMode: "DICOM" | "PACS";
    private hasOneStudy: boolean = true;

    constructor(
            private breadcrumbsService: BreadcrumbsService, 
            private rightsService: StudyRightsService,
            private keycloakService: KeycloakService,
            private route: ActivatedRoute, 
            private router: Router) {

        route.url.subscribe(() => {
            if (this.route.snapshot.firstChild && this.route.snapshot.firstChild.data['importMode']) {
                this.importMode = this.route.snapshot.firstChild.data['importMode'];
            }
        })
        this.rightsService.hasOnStudyToImport().then(hasOne => this.hasOneStudy = hasOne);
    }
        
    ngOnInit() {
        this.breadcrumbsService.currentStep.importStart = true;  
    }
}