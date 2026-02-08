import { Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: 'smtp.zoho.com',
                port: 465,
                //secure: true,
                auth: {
                    user: 'no-reply@unbox.ng',
                    pass: 'Egypt@1922',
                },
            },
            template: {
                dir: __dirname + '/templates',
                adapter: new EjsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
    ],

    providers: [MailsService],
    exports: [MailsService],
})
export class MailsModule {}
