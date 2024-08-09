import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRestrictionComponent } from './document-restriction.component';

describe('DocumentRestrictionComponent', () => {
  let component: DocumentRestrictionComponent;
  let fixture: ComponentFixture<DocumentRestrictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentRestrictionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentRestrictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
