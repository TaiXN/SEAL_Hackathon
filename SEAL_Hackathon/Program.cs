using Autofac;
using Autofac.Extensions.DependencyInjection;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Services.AccessTokenService;
using Services.AccountService;
using Services.AdminService;
using Services.RefreshTokenService;
using Services.RoleService;
using Services.TeacherService;
using System.Text;

namespace SEAL_Hackathon
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: "_myAllowSpecificOrigins",
                                  policy =>
                                  {
                                      policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();

                                  });
            });
            builder.Services.AddMemoryCache();

            builder.Services.AddOpenApiDocument();
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "SEAL",
            ValidAudience = "SEAL_Client",
           IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("!@#!@#!@awodjasocdoajdxojasodj!@#!@$!@49293r913jdxadocans"))
        };
    });


            builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());

            builder.Host.ConfigureContainer<ContainerBuilder>(builder =>
            {
                builder.RegisterType<UnitOfWork>().As<IUnitOfWork>();
                builder.RegisterType<SealHackathonContext>().AsSelf();
                builder.RegisterType<AccountService>().As<IAccountService>();
                builder.RegisterType<AdminService>().As<IAdminService>();
                builder.RegisterType<RoleService>().As<IRoleService>();
                builder.RegisterType<TeacherService>().As<ITeacherService>();
                builder.RegisterType<AccessTokenService>().As<IAccessTokenService>();
                builder.RegisterType<RefreshTokenService>().As<IRefreshTokenService>();
            });

            var app = builder.Build();
          
                // Add OpenAPI 3.0 document serving middleware
                // Available at: http://localhost:<port>/swagger/v1/swagger.json
                app.UseOpenApi();

                // Add web UIs to interact with the document
                // Available at: http://localhost:<port>/swagger
                app.UseSwaggerUi(o =>
                {
                    o.Path = "";
                }); // UseSwaggerUI Protected by if (env.IsDevelopment())
                app.UseReDoc(options =>
                {
                    options.Path = "/redoc";
                });
           
            // Configure the HTTP request pipeline.

            app.UseHttpsRedirection();

            app.UseAuthorization();
            app.UseCors("_myAllowSpecificOrigins");


            app.MapControllers();

            app.Run();
        }
    }
}
