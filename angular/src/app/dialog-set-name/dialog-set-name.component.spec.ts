import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSetNameComponent } from './dialog-set-name.component';

describe('DialogSetNameComponent', () => {
  let component: DialogSetNameComponent;
  let fixture: ComponentFixture<DialogSetNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSetNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSetNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
