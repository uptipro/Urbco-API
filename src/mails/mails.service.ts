import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailsService {
    constructor(private readonly mailerService: MailerService) {}

    sendMail(to: string, type: string, extraData: any, subject: string) {
        this.mailerService
            .sendMail({
                to,
                from: '"Urbco" <no-reply@unbox.ng>',
                subject,
                template: type,
                context: {
                    ...extraData,
                },
            })
            .then(() => {
                console.log('Mail has been sent.');
            })
            .catch((err) => {
                console.log(err);
            });
    }
}
