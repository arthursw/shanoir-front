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

import { AfterViewChecked, Component, ElementRef, forwardRef } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { IMyOptions } from 'angular-mydatepicker';

@Component({
    selector: 'datepicker',
            // <my-date-picker 
            //     [options]="options" 
            //     [ngModel]="convertedDate"
            //     (ngModelChange)="onModelChange($event)"
            //     (inputFieldChanged)="onInputFieldChanged($event)"
            //     (inputFocusBlur)="onTouch()">
            // </my-date-picker>
    template: `
        <span>


            <div class="input-box-container">
              <input class="input-box" placeholder="Click to select a date" 
                angular-mydatepicker name="mydate" (click)="dp.toggleCalendar()" 
                [(ngModel)]="convertedDate" [options]="options" 
                #dp="angular-mydatepicker" (dateChanged)="onDateChanged($event)"/>
            </div>

        </span>
    `,
    styles: [
        ':host() { display: inline-block; height: 19px; }',
        ':host():has(input:focus) { border-bottom: 2px solid var(--color-a); }'
    ],
    providers: [
        {
          provide: NG_VALUE_ACCESSOR,
          useExisting: forwardRef(() => DatepickerComponent),
          multi: true,
        }]   
})

export class DatepickerComponent implements ControlValueAccessor, AfterViewChecked {

    private inputFieldContent: string;
    private lastInputFieldContent: string;
    private convertedDate: Object;
    private onTouch: () => void;
    private onChange: (value) => void;

    private options: any = {
        dateFormat: 'dd/mm/yyyy',
        height: '21px',
        width: '160px',
        indicateInvalidDate: false
    };

    constructor(private element: ElementRef) { }

    ngAfterViewChecked() {
        [].slice.call(this.element.nativeElement.getElementsByTagName('button')).forEach(elt => {
            elt.setAttribute('tabindex', -1);
        });
    }

    private onInputFieldChanged(event) {
        this.lastInputFieldContent = this.inputFieldContent;
        this.inputFieldContent = event.value;
    }

    onModelChange(event) {
        setTimeout(() => {
            if (this.inputFieldContent == this.lastInputFieldContent) return;
            if (event && event.epoc) {
                this.onChange(new Date(event.epoc * 1000));
            } else if (this.inputFieldContent) {
                this.onChange('invalid');
            } else {
                this.onChange(null);
            }
            this.onTouch();
        })
    }

    writeValue(value: any): void {
        if (value) {
            this.convertedDate = {jsdate: new Date(value)};
        } else {
            this.convertedDate = null; 
        }
    }
    
    registerOnChange(fn: (_: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }
    
    public static validator = (control: AbstractControl): ValidationErrors | null => {
        if (control.value == 'invalid') {
            return { format: true}
        }
        return null;
    }
}