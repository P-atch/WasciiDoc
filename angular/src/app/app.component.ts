import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {ToolbarService} from "./toolbar/toolbar.service";
import {AuthService} from "../auth/auth.service";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DbUser, ServerError, ServerSuccess, SocketioService} from "./socketio/socketio.service";
import {LoaderService} from "./loader/loader.service";

@Component({
  selector: 'app-root',

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('slideInFromBottom', [
      state('hidden', style({ transform: 'translateY(200%)', opacity: 0 })),
      state('visible', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('hidden => visible', [
        animate('200ms ease-in')
      ]),
      transition('visible => hidden', [
        animate('200ms ease-out')
      ])
    ])
  ]
})
export class AppComponent implements OnInit, OnDestroy {

  //@ViewChild('connectButtonTemplate', { static: true }) connectButtonTemplate!: TemplateRef<any>;
  @ViewChild('connectCardContainer') connectCardContainer!: ElementRef;
  title = 'WasciiDoc';
  toolbarElementsLeft: TemplateRef<any>[] = [];
  toolbarElementsRight: TemplateRef<any>[] = [];
  isDarkTheme = false;
  cardState = 'hidden';
  loaderIndex: number;
  protected showOverlay = true;

  constructor(private router: Router, private toolbarService: ToolbarService, protected auth: AuthService, private errorSnackBar: MatSnackBar, private socket: SocketioService, protected loadingService: LoaderService) {}

  displayError(error: ServerError) {
    console.warn("Received error : ", error.error);
    this.errorSnackBar.open(error.error, "Dismiss", {duration: 2000});
  }
  displaySuccess(success: ServerSuccess) {
    this.errorSnackBar.open(success.message, "Dismiss", {duration: 2000});
  }

  ngOnInit() {
    console.log("On main init called")
    this.loadingService.loading$.subscribe(value => {
      this.loaderIndex = value;
    })
    const storedTheme = localStorage.getItem("theme");
    if(storedTheme === "dark") {
      this.toggleTheme();
    }
    this.toolbarService.toolbarElementsLeft$.subscribe(elements => {
      this.toolbarElementsLeft = elements;
    })
    this.toolbarService.toolbarElementsRight$.subscribe(elements => {
      this.toolbarElementsRight = elements;
    })

    this.socket.display_error_observe().subscribe((data: ServerError) => {
      this.displayError(data);
    })

    this.socket.display_success_observe().subscribe((data: ServerSuccess) => {
      this.displaySuccess(data);
    })
  }

  displayAuthentCard() {
    //this.connectCardContainer.nativeElement.style.display = "flex";

    if(this.connectCardContainer.nativeElement.style.display === "flex") {
      setTimeout(() => {
        this.connectCardContainer.nativeElement.style.display = "none";
      }, 500);
    } else {
      this.connectCardContainer.nativeElement.style.display = "flex";

    }

    this.cardState = this.cardState === 'hidden' ? 'visible' : 'hidden';

  }

  ngOnDestroy() {
    //this.toolbarService.removeElement(this.connectButtonTemplate, "right");
  }

  toggleTheme() {
    if(this.isDarkTheme) {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      localStorage.setItem("theme", "dark");
    }
    this.isDarkTheme = !this.isDarkTheme;
  }

  navigateToMainPage() {
    this.router.navigate(["/"]);
  }
}
