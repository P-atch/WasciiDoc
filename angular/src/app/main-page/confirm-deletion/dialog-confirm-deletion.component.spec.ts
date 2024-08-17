import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmDeletionComponent } from './dialog-confirm-deletion.component';

describe('ConfirmDeletionComponent', () => {
  let component: DialogConfirmDeletionComponent;
  let fixture: ComponentFixture<DialogConfirmDeletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogConfirmDeletionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogConfirmDeletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
