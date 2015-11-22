create type distribution as enum('stable', 'testing', 'unstable', 'experimental');
create type component as enum('main');

create table source (
    name varchar(255) not null,
    distribution distribution not null,
    component component not null default 'main',
    version varchar(255) not null,
    directory varchar(255) not null,
    -- original_archive can be empty when debian is the upstream
    original_archive varchar(255),
    debian_archive varchar(255) not null,
    primary key(name, distribution, version)
);

create table source_folder (
    path varchar(255) primary key,
    created timestamp not null default current_timestamp
);
