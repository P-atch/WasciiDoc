import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocOwnersComponent } from './doc-owners.component';

describe('DocOwnersComponent', () => {
  let component: DocOwnersComponent;
  let fixture: ComponentFixture<DocOwnersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocOwnersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocOwnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
